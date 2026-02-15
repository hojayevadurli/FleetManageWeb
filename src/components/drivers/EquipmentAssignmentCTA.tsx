import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Truck } from "lucide-react";

interface EquipmentAssignmentCTAProps {
    driverId: string;
    onAssignClick: () => void;
}

export function EquipmentAssignmentCTA({ driverId, onAssignClick }: EquipmentAssignmentCTAProps) {
    return (
        <Card className="bg-blue-50 border-blue-200 shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">No equipment assigned</h3>
                        <p className="text-sm text-gray-600">
                            Assign this driver to a truck or trailer to track usage, safety, and maintenance.
                        </p>
                    </div>
                </div>
                <Button onClick={onAssignClick} className="bg-blue-600 hover:bg-blue-700">
                    Assign Equipment
                </Button>
            </CardContent>
        </Card>
    );
}
