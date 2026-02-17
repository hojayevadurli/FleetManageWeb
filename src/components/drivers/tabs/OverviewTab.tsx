import { OperatorDto } from "@/lib/types";
import { DriverForm } from "@/components/drivers/DriverForm";
import { DriverOverview } from "@/components/drivers/DriverOverview";

interface OverviewTabProps {
    driver: OperatorDto;
    isEditing?: boolean;
    onCancel?: () => void;
    onEdit?: () => void;
    onSave?: () => void;
    // Equipment Props
    hasEquipment?: boolean;
    onAssignEquipment?: () => void;
    assignmentRefreshKey?: number;
    onAssignmentEnded?: () => void;
}

export function OverviewTab({
    driver,
    isEditing = false,
    onCancel,
    onEdit,
    onSave,
    hasEquipment,
    onAssignEquipment,
    assignmentRefreshKey,
    onAssignmentEnded
}: OverviewTabProps) {
    if (isEditing) {
        return (
            <DriverForm
                mode="edit"
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

    return (
        <DriverOverview
            driver={driver}
            onEdit={onEdit}
            hasEquipment={hasEquipment}
            onAssignEquipment={onAssignEquipment}
            assignmentRefreshKey={assignmentRefreshKey}
            onAssignmentEnded={onAssignmentEnded}
        />
    );
}
