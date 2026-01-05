
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client"; // Removed - using backend API
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthContext";

export interface InspectionTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  vehicle_type: 'truck' | 'trailer' | 'both';
  is_pti: boolean;
  is_default: boolean;
  fields: any[];
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  user_id: string;
  template_id?: string;
  work_order_id?: string;
  vehicle_id: string;
  vehicle_type: string;
  driver_id?: string;
  inspection_name: string;
  inspection_date: string;
  status: 'in_progress' | 'completed' | 'failed';
  overall_result?: 'pass' | 'pass_with_issues' | 'fail';
  location?: any;
  signature_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface InspectionResult {
  id: string;
  inspection_id: string;
  item_name: string;
  item_category: string;
  result: 'pass' | 'fail' | 'na' | 'needs_attention';
  notes?: string;
  photos?: string[];
  videos?: string[];
  created_at: string;
}

export const useInspections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inspection templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ['inspection-templates'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('inspection_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching templates:', error);
        throw error;
      }
      return data as InspectionTemplate[];
    },
    enabled: !!user
  });

  // Fetch completed inspections
  const {
    data: inspections = [],
    isLoading: inspectionsLoading,
    error: inspectionsError
  } = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('inspections')
        .select(`
          *,
          work_orders(work_order_number, title)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inspections:', error);
        throw error;
      }
      return data as Inspection[];
    },
    enabled: !!user
  });

  // Create inspection template
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: Omit<InspectionTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('inspection_templates')
        .insert([{ ...templateData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection-templates'] });
      toast({
        title: "Success",
        description: "Inspection template created successfully"
      });
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection template",
        variant: "destructive"
      });
    }
  });

  // Create inspection
  const createInspectionMutation = useMutation({
    mutationFn: async (inspectionData: Omit<Inspection, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('inspections')
        .insert([{ ...inspectionData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Success",
        description: "Inspection created successfully"
      });
    },
    onError: (error) => {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive"
      });
    }
  });

  // Update inspection
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Inspection> }) => {
      const { data, error } = await supabase
        .from('inspections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast({
        title: "Success",
        description: "Inspection updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to update inspection",
        variant: "destructive"
      });
    }
  });

  // Create default templates for the user (only when called)
  const createDefaultTemplates = async () => {
    if (!user) return;

    // Check if user already has templates to avoid duplicates
    const { data: existingTemplates } = await supabase
      .from('inspection_templates')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingTemplates && existingTemplates.length > 0) {
      console.log('User already has templates, skipping default template creation');
      return;
    }

    const defaultTemplates = [
      {
        name: 'DOT Pre-Trip Inspection',
        description: 'Federal DOT required daily pre-trip inspection for trucks',
        vehicle_type: 'truck' as const,
        is_pti: true,
        is_default: true,
        fields: [
          {
            category: "Engine Compartment",
            items: ["Engine oil level", "Coolant level", "Power steering fluid", "Windshield washer fluid", "Battery condition", "Belts and hoses", "Air filter", "Leaks or damage"]
          },
          {
            category: "Cab and Controls", 
            items: ["Gauges and warning lights", "Steering wheel play", "Horn", "Windshield wipers", "Mirrors", "Seatbelt", "Emergency equipment", "Logbook"]
          },
          {
            category: "Lights and Reflectors",
            items: ["Headlights", "Taillights", "Turn signals", "4-way flashers", "Clearance lights", "Reflectors", "License plate light"]
          },
          {
            category: "Tires and Wheels",
            items: ["Tire condition and tread depth", "Tire pressure", "Wheel mounting", "Valve stems", "Lug nuts"]
          },
          {
            category: "Brakes",
            items: ["Brake adjustment", "Brake drums/rotors", "Brake hoses and lines", "Brake chambers", "Slack adjusters", "Air pressure buildup"]
          },
          {
            category: "Suspension and Steering",
            items: ["Springs and shocks", "Steering linkage", "Ball joints", "Tie rods", "Pitman arm", "Drag link"]
          },
          {
            category: "Frame and Body",
            items: ["Frame condition", "Cab mounting", "Doors and hinges", "Fuel tanks", "Exhaust system", "Drive shaft"]
          }
        ]
      },
      {
        name: 'Post-Trip Inspection',
        description: 'End-of-day vehicle condition check for trucks',
        vehicle_type: 'truck' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Vehicle Condition",
            items: ["Any damage during trip", "Fluid leaks", "Unusual noises", "Warning lights", "Tire wear"]
          },
          {
            category: "Equipment Check",
            items: ["Emergency equipment secure", "Load securement", "Doors and latches", "Steps and handholds"]
          },
          {
            category: "Maintenance Needs",
            items: ["Required repairs", "Scheduled maintenance due", "Parts needed", "Service recommendations"]
          }
        ]
      },
      {
        name: 'Weekly Safety Check',
        description: 'Comprehensive weekly safety inspection for trucks',
        vehicle_type: 'truck' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Safety Systems",
            items: ["Fire extinguisher", "First aid kit", "Emergency triangles", "Spare fuses", "Emergency phone numbers"]
          },
          {
            category: "Preventive Items",
            items: ["Air filter condition", "Coolant hoses", "Belt tension", "Battery terminals", "Wiper blades"]
          },
          {
            category: "Operational Check",
            items: ["All lights functioning", "Horn operation", "Mirror adjustment", "Seat condition", "HVAC system"]
          }
        ]
      },
      {
        name: 'Monthly Preventive Maintenance',
        description: 'Detailed monthly maintenance inspection for trucks',
        vehicle_type: 'truck' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Engine Performance",
            items: ["Oil change due", "Filter replacements", "Coolant condition", "Fuel system", "Air intake system"]
          },
          {
            category: "Drivetrain",
            items: ["Transmission fluid", "Differential oil", "Drive belts", "U-joints", "CV joints"]
          },
          {
            category: "Chassis Components",
            items: ["Brake inspection", "Suspension components", "Steering system", "Exhaust system", "Frame inspection"]
          },
          {
            category: "Electrical System",
            items: ["Battery test", "Alternator output", "Starter condition", "Wiring inspection", "Light function"]
          }
        ]
      },
      {
        name: 'Annual DOT Inspection',
        description: 'Complete annual DOT compliance inspection for trucks',
        vehicle_type: 'truck' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "DOT Compliance",
            items: ["DOT number displayed", "Medical certificate", "Driver qualification file", "Hours of service compliance"]
          },
          {
            category: "Vehicle Registration",
            items: ["Registration current", "Insurance current", "IRP registration", "IFTA decals", "Safety inspection current"]
          },
          {
            category: "Comprehensive Systems Check",
            items: ["Complete brake system", "All lighting systems", "Steering and suspension", "Tires and wheels", "Frame and body integrity"]
          }
        ]
      },
      {
        name: 'Trailer Pre-Trip Inspection',
        description: 'Daily pre-trip inspection checklist for trailers',
        vehicle_type: 'trailer' as const,
        is_pti: true,
        is_default: true,
        fields: [
          {
            category: "Coupling System",
            items: ["Fifth wheel connection", "Safety chains", "Electrical connection", "Air lines", "Landing gear"]
          },
          {
            category: "Trailer Body",
            items: ["Doors and hinges", "Roof condition", "Side walls", "Floor condition", "Tie-down points"]
          },
          {
            category: "Wheels and Tires",
            items: ["Tire condition", "Tire pressure", "Wheel mounting", "Valve stems", "Spare tire"]
          },
          {
            category: "Brakes and Suspension",
            items: ["Brake adjustment", "Air brake connections", "Suspension springs", "Shock absorbers", "Axle condition"]
          },
          {
            category: "Lights and Electrical",
            items: ["Taillights", "Brake lights", "Turn signals", "Clearance lights", "Reflectors", "License plate"]
          }
        ]
      },
      {
        name: 'Trailer Weekly Check',
        description: 'Weekly maintenance inspection for trailers',
        vehicle_type: 'trailer' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Structural Integrity",
            items: ["Frame condition", "Cross members", "Floor integrity", "Wall condition", "Roof leaks"]
          },
          {
            category: "Hardware Check",
            items: ["Door hardware", "Hinges and latches", "Tie-down points", "Load bars", "Straps and chains"]
          },
          {
            category: "Maintenance Items",
            items: ["Grease fittings", "Bearing condition", "Brake wear", "Light operation", "Reflector condition"]
          }
        ]
      },
      {
        name: 'Accident/Incident Inspection',
        description: 'Post-accident or incident vehicle assessment',
        vehicle_type: 'both' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Damage Assessment",
            items: ["Body damage", "Frame damage", "Glass damage", "Light damage", "Functional systems affected"]
          },
          {
            category: "Safety Systems",
            items: ["Brakes operational", "Steering functional", "Lights working", "Warning devices", "Emergency equipment"]
          },
          {
            category: "Roadworthiness",
            items: ["Safe to drive", "Tow required", "Repairs needed", "Parts required", "Estimated downtime"]
          },
          {
            category: "Documentation",
            items: ["Photos taken", "Police report filed", "Insurance notified", "Maintenance scheduled", "Driver statement"]
          }
        ]
      },
      {
        name: 'Return from Shop Inspection',
        description: 'Quality check after maintenance or repair work',
        vehicle_type: 'both' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Work Completed",
            items: ["All requested work done", "Quality of workmanship", "Parts properly installed", "No additional damage", "Work order signed off"]
          },
          {
            category: "Operational Test",
            items: ["Test drive completed", "All systems functional", "No unusual noises", "No warning lights", "Performance acceptable"]
          },
          {
            category: "Cleanliness and Condition",
            items: ["Vehicle cleaned", "Tools removed", "No shop debris", "Fluids topped off", "Ready for service"]
          }
        ]
      },
      {
        name: 'Quick Daily Safety Check',
        description: 'Fast 5-minute daily safety verification',
        vehicle_type: 'both' as const,
        is_pti: false,
        is_default: true,
        fields: [
          {
            category: "Essential Safety",
            items: ["Brakes working", "Lights operational", "Tires inflated", "No obvious leaks", "Mirrors clean"]
          },
          {
            category: "Basic Operation",
            items: ["Engine starts normally", "Steering responsive", "Warning lights off", "Horn works", "Wipers functional"]
          },
          {
            category: "Quick Visual",
            items: ["No visible damage", "Fluids adequate", "Belts intact", "No loose parts", "Ready for operation"]
          }
        ]
      }
    ];

    try {
      for (const template of defaultTemplates) {
        await createTemplateMutation.mutateAsync(template);
      }
    } catch (error) {
      console.error('Failed to create default templates:', error);
    }
  };

  return {
    templates,
    inspections,
    templatesLoading,
    inspectionsLoading,
    createTemplate: createTemplateMutation.mutate,
    createInspection: createInspectionMutation.mutate,
    updateInspection: updateInspectionMutation.mutate,
    createDefaultTemplates, // Only create when explicitly called
    isCreatingTemplate: createTemplateMutation.isPending,
    isCreatingInspection: createInspectionMutation.isPending,
    isUpdatingInspection: updateInspectionMutation.isPending
  };
};
