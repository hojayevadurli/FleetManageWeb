
import { useState } from "react";
import PreferencesSection from "@/components/account/PreferencesSection";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PreferencesTab = () => {
    const [timeZone, setTimeZone] = useState("America/Chicago");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsSaving(false);
        toast.success("Preferences saved successfully!");
    };

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-500 w-full">
            <PreferencesSection
                timeZone={timeZone}
                setTimeZone={setTimeZone}
            />

            <div className="flex justify-end pt-4">
                <Button
                    onClick={handleSave}
                    size="lg"
                    disabled={isSaving}
                    className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-12 py-6 text-lg w-48"
                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </div>
    );
};

export default PreferencesTab;
