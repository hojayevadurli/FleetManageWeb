using System;
using System.Net.Http;
using System.Threading.Tasks;
using Npgsql;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.DependencyInjection;

class Program
{
    static async Task Main()
    {
        // ── 1. Decrypt Motive API key from the database ─────────────────────
        string connStr = "Host=localhost;Port=5432;Database=FleetManage;Username=fleet;Password=00209336$Azymjan";
        string encKey = "";

        using (var conn = new NpgsqlConnection(connStr))
        {
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand(
                "SELECT \"EncryptedApiKey\" FROM \"TenantIntegrations\" WHERE \"Provider\" = 'Motive' LIMIT 1;", conn);
            encKey = (string)await cmd.ExecuteScalarAsync();
        }

        var services = new ServiceCollection();
        services.AddDataProtection().SetApplicationName("FleetManage.Api");
        var sp = services.BuildServiceProvider();
        var dp = sp.GetRequiredService<IDataProtectionProvider>();
        var key = dp.CreateProtector("MotiveApiKey").Unprotect(encKey);

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Add("X-API-Key", key);

        // ── 2. Vehicle Locations (shows GPS + speed + bearing) ───────────────
        Console.WriteLine("=== /v1/vehicle_locations (location + speed) ===");
        var locRes = await http.GetAsync("https://api.keeptruckin.com/v1/vehicle_locations?per_page=3");
        Console.WriteLine(await locRes.Content.ReadAsStringAsync());
        Console.WriteLine();

        // ── 3. Vehicle Stats (fuel_percentage, engine_hours, odometer) ────────
        // This is the endpoint that returns fuel level from OBD2/J1939 sensors.
        // Field to look for: "fuel_percentage" (0–100)
        Console.WriteLine("=== /v1/vehicle_stats (fuel + engine hours) ===");
        var statsRes = await http.GetAsync("https://api.keeptruckin.com/v1/vehicle_stats?per_page=3");
        Console.WriteLine(await statsRes.Content.ReadAsStringAsync());
        Console.WriteLine();

        // ── 4. Vehicles list (model, year, externalId mapping) ────────────────
        Console.WriteLine("=== /v1/vehicles (vehicle details + externalId) ===");
        var vehRes = await http.GetAsync("https://api.keeptruckin.com/v1/vehicles?per_page=3");
        Console.WriteLine(await vehRes.Content.ReadAsStringAsync());
        Console.WriteLine();

        Console.WriteLine("Done. Look for 'fuel_percentage' in /v1/vehicle_stats response above.");
        Console.WriteLine("Backend handler for sync-fuel-level should:");
        Console.WriteLine("  1. GET /v1/vehicle_stats from Motive");
        Console.WriteLine("  2. Match each vehicle by externalId");
        Console.WriteLine("  3. UPDATE Equipment SET TelematicsFuelLevel = fuel_percentage WHERE ExternalId = id");
    }
}
