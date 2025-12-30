
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AI chat function called');
    
    // Comprehensive API key validation
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please check your environment configuration.',
        errorType: 'missing_api_key'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate API key format
    if (!openAIApiKey.startsWith('sk-')) {
      console.error('OpenAI API key appears to be invalid format');
      return new Response(JSON.stringify({ 
        error: 'Invalid OpenAI API key format. API key should start with "sk-".',
        errorType: 'invalid_api_key_format'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenAI API key found and validated, processing request');
    const { messages } = await req.json();
    console.log('Received messages:', messages?.length || 0);

    // Test API key with a simple health check first
    console.log('Testing OpenAI API connection...');
    const testResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!testResponse.ok) {
      const testError = await testResponse.text();
      console.error('OpenAI API key validation failed:', testResponse.status, testError);
      
      let errorMessage = 'Failed to validate OpenAI API key.';
      let errorType = 'api_validation_failed';
      
      if (testResponse.status === 401) {
        errorMessage = 'Invalid OpenAI API key. Please check your API key and try again.';
        errorType = 'invalid_api_key';
      } else if (testResponse.status === 429) {
        errorMessage = 'OpenAI API rate limit exceeded. Please wait and try again.';
        errorType = 'rate_limit_exceeded';
      } else if (testResponse.status === 403) {
        errorMessage = 'OpenAI API access forbidden. Please check your account status and billing.';
        errorType = 'access_forbidden';
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        errorType: errorType,
        statusCode: testResponse.status
      }), {
        status: testResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('OpenAI API key validated successfully');

    const systemPrompt = `You are FleetBot, an AI assistant specialized in fleet management for Fleetmanage.ai. You help fleet managers with:

- Vehicle maintenance scheduling and recommendations
- Truck and trailer management
- Work order creation and tracking
- DOT inspection preparation and compliance
- Driver management and scheduling
- Cost optimization strategies
- Maintenance history analysis
- Shop operations and vendor management
- Fleet performance analytics

You have access to comprehensive fleet data including trucks, trailers, maintenance records, work orders, inspections, and shop information. Provide practical, actionable advice for fleet operations. Be concise but thorough in your responses.

When discussing specific vehicles, maintenance tasks, or operational procedures, reference industry best practices and DOT regulations where applicable.`;

    console.log('Making request to OpenAI API for chat completion');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      }),
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      
      let errorMessage = 'Failed to get response from AI service.';
      let errorType = 'api_error';
      
      if (response.status === 401) {
        errorMessage = 'Authentication failed. Your OpenAI API key may be invalid or expired.';
        errorType = 'authentication_failed';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again, or check your OpenAI usage limits.';
        errorType = 'rate_limit_exceeded';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request format. Please try again.';
        errorType = 'invalid_request';
      } else if (response.status === 403) {
        errorMessage = 'Access forbidden. Please check your OpenAI account status and billing.';
        errorType = 'access_forbidden';
      }
      
      return new Response(JSON.stringify({ 
        error: errorMessage,
        errorType: errorType,
        statusCode: response.status
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          console.error('No reader available from OpenAI response');
          controller.close();
          return;
        }

        try {
          console.log('Starting to stream response');
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream complete');
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.log('Skipping invalid JSON:', data);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      errorType: 'unexpected_error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
