
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PersonalInformationSection from "./account/PersonalInformationSection";
import MotiveIntegrationSection from "./account/MotiveIntegrationSection";
import UserManagementSection from "./account/UserManagementSection";
import PreferencesSection from "./account/PreferencesSection";
import AccountActionsSection from "./account/AccountActionsSection";
import BillingSection from "./account/BillingSection";

const Account = () => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("johndoe@email.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [companyName, setCompanyName] = useState("Fleet Management Co.");
  const [timeZone, setTimeZone] = useState("America/New_York");
  const [unitSystem, setUnitSystem] = useState("imperial");
  
  // Motive integration settings
  const [motiveEnabled, setMotiveEnabled] = useState(false);
  const [motiveApiKey, setMotiveApiKey] = useState("");
  const [motiveBaseUrl, setMotiveBaseUrl] = useState("https://api.gomotive.com");
  const [motiveConnected, setMotiveConnected] = useState(false);

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving changes:", { 
      name, 
      email, 
      phone, 
      companyName, 
      timeZone, 
      unitSystem 
    });
    toast.success("Account details updated successfully!");
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
