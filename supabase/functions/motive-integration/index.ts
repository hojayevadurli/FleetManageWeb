import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// verify the caller's JWT and role (admin)


serve(async (req:any) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, vehicleId, motiveVehicleId } = await req.json()
    const motiveApiKey = Deno.env.get('MOTIVE_API_KEY')
    const motiveBaseUrl = Deno.env.get('MOTIVE_BASE_URL') || 'https://api.gomotive.com/v1'

    if (!motiveApiKey) {
      throw new Error('Motive API key not configured')
    }

    const motiveHeaders = {
      'Authorization': `Bearer ${motiveApiKey}`,
      'Content-Type': 'application/json'
    }

    // Helper function to log sync operations
    const logSync = async (syncType: string, status: string, details: any = {}) => {
      return await supabaseClient
        .from('sync_logs')
        .insert({
          sync_type: syncType,
          status,
          records_processed: details.processed || 0,
          records_successful: details.successful || 0,
          records_failed: details.failed || 0,
          sync_details: details,
          error_message: details.error,
          completed_at: status !== 'pending' ? new Date().toISOString() : null
        })
    }

const authHeader = req.headers.get('Authorization') ?? '';
if (!authHeader.startsWith('Bearer ')) {
  return new Response(JSON.stringify({ success: false, error: 'Missing bearer token' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// create a second client bound to the caller's JWT (for auth only)
const userClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  { global: { headers: { Authorization: authHeader } } }
);

// get user → confirm admin in profiles
const { data: { user }, error: userErr } = await userClient.auth.getUser();
if (userErr || !user) {
  return new Response(JSON.stringify({ success:false, error:'Invalid token' }), {
    status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

const { data: me } = await userClient
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .single();

if (!me || me.role !== 'admin') {
  return new Response(JSON.stringify({ success:false, error:'Forbidden (admin only)' }), {
    status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}




    switch (action) {
      case 'sync_drivers': {
        console.log('Starting driver sync from Motive...')
        await logSync('drivers', 'pending')

        try {
          const response = await fetch(`${motiveBaseUrl}/users`, {
            headers: motiveHeaders
          })

          if (!response.ok) {
            throw new Error(`Motive API error: ${response.status}`)
          }

          const data = await response.json()
          const drivers = data.users?.filter((user: any) => user.role === 'driver') || []
          
          console.log(`Found ${drivers.length} drivers to sync`)

          let successful = 0
          let failed = 0
          const errors: string[] = []

          for (const driver of drivers) {
            try {
              const driverData = {
                motive_driver_id: driver.id,
                name: driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
                email: driver.email,
                phone: driver.phone,
                license_number: driver.license_number,
                license_state: driver.license_state,
                license_expiry: driver.license_expiry ? new Date(driver.license_expiry).toISOString().split('T')[0] : null,
                role: 'driver',
                status: driver.status === 'active' ? 'active' : 'inactive'
              }

              const { error } = await supabaseClient
                .from('drivers')
                .upsert(driverData, { 
                  onConflict: 'motive_driver_id',
                  ignoreDuplicates: false 
                })

              if (error) {
                console.error(`Error syncing driver ${driver.id}:`, error)
                errors.push(`Driver ${driver.id}: ${error.message}`)
                failed++
              } else {
                successful++
              }
            } catch (err:any) {
              console.error(`Error processing driver ${driver.id}:`, err)
              errors.push(`Driver ${driver.id}: ${err.message}`)
              failed++
            }
          }

          await logSync('drivers', successful > 0 ? 'success' : 'error', {
            processed: drivers.length,
            successful,
            failed,
            error: errors.length > 0 ? errors.join('; ') : null
          })

          return new Response(JSON.stringify({
            success: true,
            message: `Synced ${successful} drivers successfully, ${failed} failed`,
            stats: { processed: drivers.length, successful, failed }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        } catch (error:any) {
          console.error('Driver sync error:', error)
          await logSync('drivers', 'error', { error: error.message })
          throw error
        }
      }

      case 'sync_vehicles_complete': {
        console.log('Starting complete vehicle sync from Motive...')
        await logSync('vehicles', 'pending')

        try {
          const response = await fetch(`${motiveBaseUrl}/vehicles`, {
            headers: motiveHeaders
          })

          if (!response.ok) {
            throw new Error(`Motive API error: ${response.status}`)
          }

          const data = await response.json()
          const vehicles = data.vehicles || []
          
          console.log(`Found ${vehicles.length} vehicles to sync`)

          let successful = 0
          let failed = 0
          const errors: string[] = []

          for (const vehicle of vehicles) {
            try {
              const vehicleData = {
                motive_vehicle_id: vehicle.id,
                vehicle_id: vehicle.number || vehicle.id,
                vin: vehicle.vin,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year ? parseInt(vehicle.year) : new Date().getFullYear(),
                license_plate: vehicle.license_plate,
                fuel_type: vehicle.fuel_type,
                vehicle_type: vehicle.vehicle_type || 'truck',
                external_id: vehicle.external_id,
                status: vehicle.status === 'active' ? 'active' : 'inactive',
                current_location: vehicle.current_location ? {
                  latitude: vehicle.current_location.lat,
                  longitude: vehicle.current_location.lng,
                  address: vehicle.current_location.address
                } : null,
                last_location_update: vehicle.last_location_update ? new Date(vehicle.last_location_update).toISOString() : null,
                odometer_reading: vehicle.odometer_reading,
                engine_hours: vehicle.engine_hours,
                fuel_level: vehicle.fuel_level,
                driver_assigned: vehicle.driver_assigned?.name,
                sync_status: 'synced',
                last_sync_at: new Date().toISOString()
              }

              const { error } = await supabaseClient
                .from('vehicles')
                .upsert(vehicleData, { 
                  onConflict: 'motive_vehicle_id',
                  ignoreDuplicates: false 
                })

              if (error) {
                console.error(`Error syncing vehicle ${vehicle.id}:`, error)
                errors.push(`Vehicle ${vehicle.id}: ${error.message}`)
                failed++
              } else {
                successful++
              }
            } catch (err:any) {
              console.error(`Error processing vehicle ${vehicle.id}:`, err)
              errors.push(`Vehicle ${vehicle.id}: ${err.message}`)
              failed++
            }
          }

          await logSync('vehicles', successful > 0 ? 'success' : 'error', {
            processed: vehicles.length,
            successful,
            failed,
            error: errors.length > 0 ? errors.join('; ') : null
          })

          return new Response(JSON.stringify({
            success: true,
            message: `Synced ${successful} vehicles successfully, ${failed} failed`,
            stats: { processed: vehicles.length, successful, failed }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        } catch (error:any) {
          console.error('Vehicle sync error:', error)
          await logSync('vehicles', 'error', { error: error.message })
          throw error
        }
      }

      case 'sync_all_entities': {
        console.log('Starting complete entity sync (drivers + vehicles)...')
        await logSync('all_entities', 'pending')

        try {
          // Sync drivers first
          const driversResponse = await fetch(`${motiveBaseUrl}/users`, {
            headers: motiveHeaders
          })

          if (!driversResponse.ok) {
            throw new Error(`Motive API error for drivers: ${driversResponse.status}`)
          }

          const driversData = await driversResponse.json()
          const drivers = driversData.users?.filter((user: any) => user.role === 'driver') || []

          // Sync vehicles
          const vehiclesResponse = await fetch(`${motiveBaseUrl}/vehicles`, {
            headers: motiveHeaders
          })

          if (!vehiclesResponse.ok) {
            throw new Error(`Motive API error for vehicles: ${vehiclesResponse.status}`)
          }

          const vehiclesData = await vehiclesResponse.json()
          const vehicles = vehiclesData.vehicles || []

          console.log(`Syncing ${drivers.length} drivers and ${vehicles.length} vehicles`)

          let totalSuccessful = 0
          let totalFailed = 0
          const errors: string[] = []

          // Process drivers
          for (const driver of drivers) {
            try {
              const driverData = {
                motive_driver_id: driver.id,
                name: driver.name || `${driver.first_name || ''} ${driver.last_name || ''}`.trim(),
                email: driver.email,
                phone: driver.phone,
                license_number: driver.license_number,
                license_state: driver.license_state,
                license_expiry: driver.license_expiry ? new Date(driver.license_expiry).toISOString().split('T')[0] : null,
                role: 'driver',
                status: driver.status === 'active' ? 'active' : 'inactive'
              }

              const { error } = await supabaseClient
                .from('drivers')
                .upsert(driverData, { onConflict: 'motive_driver_id' })

              if (error) {
                errors.push(`Driver ${driver.id}: ${error.message}`)
                totalFailed++
              } else {
                totalSuccessful++
              }
            } catch (err:any) {
              errors.push(`Driver ${driver.id}: ${err.message}`)
              totalFailed++
            }
          }

          // Process vehicles
          for (const vehicle of vehicles) {
            try {
              const vehicleData = {
                motive_vehicle_id: vehicle.id,
                vehicle_id: vehicle.number || vehicle.id,
                vin: vehicle.vin,
                make: vehicle.make,
                model: vehicle.model,
                year: vehicle.year ? parseInt(vehicle.year) : new Date().getFullYear(),
                license_plate: vehicle.license_plate,
                fuel_type: vehicle.fuel_type,
                vehicle_type: vehicle.vehicle_type || 'truck',
                external_id: vehicle.external_id,
                status: vehicle.status === 'active' ? 'active' : 'inactive',
                current_location: vehicle.current_location ? {
                  latitude: vehicle.current_location.lat,
                  longitude: vehicle.current_location.lng,
                  address: vehicle.current_location.address
                } : null,
                last_location_update: vehicle.last_location_update ? new Date(vehicle.last_location_update).toISOString() : null,
                odometer_reading: vehicle.odometer_reading,
                engine_hours: vehicle.engine_hours,
                fuel_level: vehicle.fuel_level,
                driver_assigned: vehicle.driver_assigned?.name,
                sync_status: 'synced',
                last_sync_at: new Date().toISOString()
              }

              const { error } = await supabaseClient
                .from('vehicles')
                .upsert(vehicleData, { onConflict: 'motive_vehicle_id' })

              if (error) {
                errors.push(`Vehicle ${vehicle.id}: ${error.message}`)
                totalFailed++
              } else {
                totalSuccessful++
              }
            } catch (err) {
              errors.push(`Vehicle ${vehicle.id}: ${err.message}`)
              totalFailed++
            }
          }

          await logSync('all_entities', totalSuccessful > 0 ? 'success' : 'error', {
            processed: drivers.length + vehicles.length,
            successful: totalSuccessful,
            failed: totalFailed,
            error: errors.length > 0 ? errors.join('; ') : null,
            drivers_count: drivers.length,
            vehicles_count: vehicles.length
          })

          return new Response(JSON.stringify({
            success: true,
            message: `Complete sync finished: ${totalSuccessful} entities synced, ${totalFailed} failed`,
            stats: { 
              processed: drivers.length + vehicles.length, 
              successful: totalSuccessful, 
              failed: totalFailed,
              drivers: drivers.length,
              vehicles: vehicles.length
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })

        } catch (error:any) {
          console.error('Complete sync error:', error)
          await logSync('all_entities', 'error', { error: error.message })
          throw error
        }
      }

      case 'sync_vehicle': {
        if (!vehicleId || !motiveVehicleId) {
          throw new Error('Vehicle ID and Motive Vehicle ID are required')
        }

        console.log(`Syncing vehicle ${vehicleId} with Motive ID ${motiveVehicleId}`)

        const response = await fetch(`${motiveBaseUrl}/vehicles/${motiveVehicleId}`, {
          headers: motiveHeaders
        })

        if (!response.ok) {
          throw new Error(`Motive API error: ${response.status}`)
        }

        const vehicleData = await response.json()
        const vehicle = vehicleData.vehicle

        const updateData = {
          current_location: vehicle.current_location ? {
            latitude: vehicle.current_location.lat,
            longitude: vehicle.current_location.lng,
            address: vehicle.current_location.address
          } : null,
          last_location_update: vehicle.last_location_update ? new Date(vehicle.last_location_update).toISOString() : null,
          odometer_reading: vehicle.odometer_reading,
          engine_hours: vehicle.engine_hours,
          fuel_level: vehicle.fuel_level,
          status_details: vehicle.status_details,
          driver_assigned: vehicle.driver_assigned?.name,
          sync_status: 'synced',
          last_sync_at: new Date().toISOString()
        }

        const { error } = await supabaseClient
          .from('vehicles')
          .update(updateData)
          .eq('id', vehicleId)

        if (error) {
          throw error
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Vehicle synced successfully',
          data: updateData
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error:any) {
    console.error('Motive integration error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
