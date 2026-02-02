
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PersonalInformationSection from "@/components/account/PersonalInformationSection";
import { SecuritySection } from "@/components/account/SecuritySection";
import AccountActionsSection from "@/components/account/AccountActionsSection";
import { tenantsApi } from "@/lib/tenantsApi";
import { useAuth } from "@/components/auth/AuthContext";
import { updateProfile } from "@/components/auth/Auth";

const AccountTab = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [industryName, setIndustryName] = useState("");
    const [industryId, setIndustryId] = useState(0);
    const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load User Data
                if (user) {
                    const firstName = user.firstName || "";
                    const lastName = user.lastName || "";
                    const fullName = user.fullName || (firstName || lastName ? `${firstName} ${lastName}`.trim() : "");
                    setName(fullName);
                    // Email is usually read-only for identity, but we can display it
                    setEmail(user.email || "");
                    // Load mock photo if available
                    setPhotoUrl(user.photoUrl);
                }

                // Load Tenant Data
                const tenantData = await tenantsApi.getCurrent();
                if (tenantData) {
                    setCompanyName(tenantData.name);
                    // Use tenant phone if available, or fallback to user phone? 
                    // For now, let's treat phone as a tenant property based on previous code, 
                    // or strictly bind it to what we get.
                    setPhone(tenantData.phone || "");
                    setIndustryName(tenantData.industryName || "");
                    setIndustryId(tenantData.industryId || 0);
                }
            } catch (e) {
                console.error("Failed to load account data", e);
                toast.error("Failed to load account details");
            }
        };
        loadData();
    }, [user]);

    const handlePhotoChange = (file: File) => {
        // Convert to data URL for immediate preview and "mock" storage
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // 1. Update Tenant (Company) Info
            await tenantsApi.updateCurrent({
                name: companyName,
                industryId: industryId,
                email: email, // Tenant email? Or keep separate? The API expects it.
                phone: phone
            });

            // 2. Update User Profile (Name)
            const updatedUser = await updateProfile({
                fullName: name,
                photoUrl: photoUrl,
                // If the backend Profile endpoint supports phone, we could send it here too.
                // For now, assume phone is on tenant for this business app logic.
            });
            updateUser(updatedUser);

            await new Promise(resolve => setTimeout(resolve, 500)); // UX delay
            toast.success("Account details updated successfully!");
        } catch (error) {
            console.error("Failed to update settings", error);
            toast.error("Failed to save changes.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSaveChanges} className="space-y-8 animate-in fade-in-50 duration-500 w-full">
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
                photoUrl={photoUrl}
                onPhotoChange={handlePhotoChange}
            />

            <SecuritySection />

            <AccountActionsSection />

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    size="lg"
                    disabled={isSaving}
                    className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-12 py-6 text-lg w-48"
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
};

export default AccountTab;
