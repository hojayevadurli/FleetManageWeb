
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PersonalInformationSection from "./account/PersonalInformationSection";
import MotiveIntegrationSection from "./account/MotiveIntegrationSection";
import UserManagementSection from "./account/UserManagementSection";
import PreferencesSection from "./account/PreferencesSection";
import AccountActionsSection from "./account/AccountActionsSection";
import BillingSection from "./account/BillingSection";
import { industriesApi, Industry } from "@/lib/industriesApi";

import { tenantsApi } from "@/lib/tenantsApi";

const Account = () => {
  const [name, setName] = useState(""); // Personal name logic might need separate handling if not in Tenant DTO
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryId, setIndustryId] = useState("");
  const [industryName, setIndustryName] = useState("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(true);
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [unitSystem, setUnitSystem] = useState("imperial");

  // Motive integration settings
  const [motiveEnabled, setMotiveEnabled] = useState(false);
  const [motiveApiKey, setMotiveApiKey] = useState("");
  const [motiveBaseUrl, setMotiveBaseUrl] = useState("https://api.gomotive.com");
  const [motiveConnected, setMotiveConnected] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [industriesData, tenantData] = await Promise.all([
          industriesApi.list(),
          tenantsApi.getCurrent()
        ]);

        setIndustries(industriesData);

        if (tenantData) {
          setCompanyName(tenantData.name);
          setEmail(tenantData.email || "");
          setPhone(tenantData.phone || "");
          setIndustryId(tenantData.industryId?.toString() || "");
          setIndustryName(tenantData.industryName || "");
          // Note: "name" state is currently personal name, but TenantDto only has Company Name. 
          // Keeping "John Doe" placeholder or leaving blank if not provided by another user-specific endpoint.
          // If the user intends for Tenant Name to be the main display name, we'd map `setName(tenantData.name)`.
          // For now, assuming Personal Name is separate (User entity) which isn't in this specific controller.
        }
      } catch (e) {
        console.error("Failed to load account data", e);
        toast.error("Failed to load account details");
      } finally {
        setIndustriesLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await tenantsApi.updateCurrent({
        name: companyName,
        industryId: parseInt(industryId) || 0,
        email: email,
        phone: phone
      });
      toast.success("Account details updated successfully!");
    } catch (error) {
      console.error("Failed to update tenant", error);
      toast.error("Failed to save changes.");
    }
  };

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSaveChanges}>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <p className="text-gray-600 text-sm pt-1">
              Manage your account settings and personal information here.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <PersonalInformationSection
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                companyName={companyName}
                setCompanyName={setCompanyName}
                industryName={industryName}
              />

              <BillingSection />

              <MotiveIntegrationSection
                motiveEnabled={motiveEnabled}
                setMotiveEnabled={setMotiveEnabled}
                motiveApiKey={motiveApiKey}
                setMotiveApiKey={setMotiveApiKey}
                motiveBaseUrl={motiveBaseUrl}
                setMotiveBaseUrl={setMotiveBaseUrl}
                motiveConnected={motiveConnected}
                setMotiveConnected={setMotiveConnected}
              />

              <UserManagementSection />

              <PreferencesSection
                timeZone={timeZone}
                setTimeZone={setTimeZone}
                unitSystem={unitSystem}
                setUnitSystem={setUnitSystem}
              />

              <AccountActionsSection />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit">Save Changes</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Account;
