import { Driver } from "@/lib/types";
import { DriverForm } from "@/components/drivers/DriverForm";

interface OverviewTabProps {
    driver: Driver;
    isEditing?: boolean;
    onCancel?: () => void;
    onSave?: () => void;
}

export function OverviewTab({ driver, isEditing = false, onCancel, onSave }: OverviewTabProps) {
    return (
        <DriverForm
            mode={isEditing ? 'edit' : 'view'}
            initialData={driver}
            onCancel={onCancel}
            onSubmit={(updatedDriver) => {
                // In real app, we might pass the updated driver back up
                console.log("Saved driver", updatedDriver);
                if (onSave) onSave();
            }}
        />
    );
}
