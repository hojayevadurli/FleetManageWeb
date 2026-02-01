# UI Updates for New Document Management System

## Overview
Updated the frontend to align with the new unified document management system that uses a single `DocumentRole` enum for Equipment, Driver, and WorkOrder documents.

## Changes Made

### 1. **types.ts** - Core Type Definitions

#### Updated `DocumentRole` Enum
- Replaced old `EquipmentDocRole` (values 0-7) with comprehensive `DocumentRole` enum
- **Equipment Documents** (10-19):
  - Insurance = 10
  - Registration = 11
  - Title = 12
  - Warranty = 13
  - Lease = 14
  - DOTInspection = 15
  - ScaleTicket = 16 (NEW)

- **Driver Documents** (30-49):
  - License = 30 (CDL)
  - MedicalCard = 31
  - TrainingCert = 32
  - Contract = 33
  - TWIC = 34
  - HazmatEndorsement = 35
  - MVR = 36
  - BackgroundCheck = 37
  - DrugTest = 38
  - ClearinghouseQuery = 39
  - RoadTest = 40
  - Orientation = 41
  - SafetyTraining = 42

- **WorkOrder Documents** (50-59):
  - Invoice = 50
  - Receipt = 51
  - Quote = 52
  - WorkOrder = 53
  - PhotoBefore = 54
  - PhotoAfter = 55
  - Inspection = 56
  - WorkOrderOther = 59

- **General**:
  - General = 0
  - Other = 99

- Added backward compatibility alias: `export const EquipmentDocRole = DocumentRole;`

#### Updated Interfaces

**EquipmentDocument**:
```typescript
export interface EquipmentDocument {
  id: string;
  equipmentId: string;
  documentId: string;
  fileUrl: string;
  fileType: string;
  docKind?: string;           // NEW
  status?: string;            // NEW
  confidenceScore?: number;   // NEW
  vendorNameRaw?: string;
  docRole: DocumentRole;      // Changed from EquipmentDocRole
  startDate?: string;
  expirationDate?: string;
  addedAt: string;
  createdAt?: string;         // NEW
}
```

**WorkOrderDocumentDto**:
```typescript
export interface WorkOrderDocumentDto {
  id: string;
  fileUrl: string;
  fileType: string;
  docKind: string;
  status: string;
  confidenceScore?: number;
  createdAt: string;
  role?: DocumentRole;        // NEW - DocumentRole enum
  amount?: number;            // NEW - Invoice/receipt amount
  providerName?: string;      // NEW - Vendor/provider name
  startDate?: string;         // NEW - Service/invoice date
  externalRef?: string;       // NEW - Invoice number, reference
  notes?: string;             // NEW - Additional notes
}
```

### 2. **equipmentApi.ts** - API Service Updates

#### Updated `uploadDocument` Method
Changed to use new two-step upload process:

1. **Upload file to storage** via `uploadsApi.uploadDocument(file)`
2. **Create document record** via `POST /api/documents`
3. **Link to equipment** via `POST /api/equipment/{id}/documents`

```typescript
async uploadDocument(equipmentId: string, formData: FormData): Promise<EquipmentDocument> {
  const file = formData.get('file') as File;
  const docRole = parseInt(formData.get('docRole') as string);
  const startDate = formData.get('startDate') as string;
  const expirationDate = formData.get('expirationDate') as string;
  const notes = formData.get('notes') as string;

  // 1. Upload to storage
  const fileUrl = await uploadsApi.uploadDocument(file);

  // 2. Create document record
  const docPayload = {
    fileUrl,
    fileType: file.type,
    docKind: equipmentApi.mapRoleToKind(docRole),
    vendorNameRaw: notes || null,
    runAiExtract: false
  };
  const docResponse = await api.post<{ id: string }>('/documents', docPayload);

  // 3. Link to equipment
  const linkPayload = {
    documentId: docResponse.data.id,
    docRole,
    startDate: startDate || null,
    expirationDate: expirationDate || null,
    notes: notes || null
  };
  const response = await api.post<EquipmentDocument>(`/equipment/${equipmentId}/documents`, linkPayload);
  return response.data;
}
```

#### Updated `mapRoleToKind` Method
Added support for new enum values (10-16) while maintaining backward compatibility with legacy values (1-7):

```typescript
mapRoleToKind(role: number): string {
  switch (role) {
    case 0: return 'general';
    // New equipment documents (10-16)
    case 10: return 'insurance';
    case 11: return 'registration';
    case 12: return 'title';
    case 13: return 'warranty';
    case 14: return 'lease';
    case 15: return 'inspection';
    case 16: return 'scale_ticket';
    // Legacy support (1-7)
    case 1: return 'registration';
    case 2: return 'title';
    case 3: return 'insurance';
    case 4: return 'warranty';
    case 5: return 'lease';
    case 6: return 'other';
    case 7: return 'inspection';
    default: return 'other';
  }
}
```

### 3. **EquipmentDocumentsTab.tsx** - UI Component Updates

#### Updated Imports
```typescript
import { Equipment, DocumentRole, EquipmentDocument } from '@/lib/types';
```

#### Updated `mapKindToRole` Function
- Changed return type from `EquipmentDocRole | null` to `DocumentRole | null`
- Added support for new enum values (10-16)
- Added support for 'scale_ticket' keyword
- Maintained backward compatibility with legacy values (1-7)

#### Updated `displayRoles` Array
Added `DocumentRole.ScaleTicket` to the display order:
```typescript
const displayRoles = [
    DocumentRole.Registration,
    DocumentRole.Insurance,
    DocumentRole.Title,
    DocumentRole.DOTInspection,
    DocumentRole.Warranty,
    DocumentRole.Lease,
    DocumentRole.ScaleTicket,  // NEW
    DocumentRole.General,
    DocumentRole.Other
];
```

#### Updated `getRoleName` Function
- Changed parameter type to `DocumentRole`
- Added case for `DocumentRole.ScaleTicket`

### 4. **DocumentUploadModal.tsx** - Upload Modal Updates

#### Updated Imports
```typescript
import { DocumentRole } from '@/lib/types';
```

#### Updated FileUploadState Interface
```typescript
interface FileUploadState {
  id: string;
  file: File;
  status: 'pending' | 'scanning' | 'ready' | 'uploading' | 'complete' | 'error';
  role: DocumentRole;  // Changed from EquipmentDocRole
  issueDate?: string;
  expirationDate?: string;
  notes: string;
  error?: string;
}
```

#### Updated AI Scanning Logic
Added support for detecting 'scale_ticket' documents:
```typescript
if (typeLower.includes('scale')) role = DocumentRole.ScaleTicket;
```

#### Updated Document Type Selector
Added Scale Ticket option and updated all enum references:
```typescript
<SelectContent>
  <SelectItem value={DocumentRole.Registration.toString()}>Registration</SelectItem>
  <SelectItem value={DocumentRole.Title.toString()}>Title</SelectItem>
  <SelectItem value={DocumentRole.Insurance.toString()}>Insurance</SelectItem>
  <SelectItem value={DocumentRole.DOTInspection.toString()}>DOT Inspection</SelectItem>
  <SelectItem value={DocumentRole.Warranty.toString()}>Warranty</SelectItem>
  <SelectItem value={DocumentRole.Lease.toString()}>Lease</SelectItem>
  <SelectItem value={DocumentRole.ScaleTicket.toString()}>Scale Ticket</SelectItem>
  <SelectItem value={DocumentRole.General.toString()}>General</SelectItem>
  <SelectItem value={DocumentRole.Other.toString()}>Other</SelectItem>
</SelectContent>
```

## API Endpoints Reference

### Equipment Documents

**Get equipment with documents:**
```
GET /api/equipment/{equipmentId}
```

**Upload document (two-step process):**
```
1. POST /api/documents
   Body: { fileUrl, fileType, docKind, vendorNameRaw, runAiExtract }
   
2. POST /api/equipment/{equipmentId}/documents
   Body: { documentId, docRole, startDate, expirationDate, notes }
```

**Remove document:**
```
DELETE /api/equipment/{equipmentId}/documents/{documentId}
```

### WorkOrder Documents

**Get attachments:**
```
GET /api/workorders/{workOrderId}/attachments
```

**Attach document:**
```
POST /api/workorders/{workOrderId}/attachments
Body: { documentId, role, startDate, amount, providerName, externalRef, notes }
```

**Detach document:**
```
DELETE /api/workorders/{workOrderId}/attachments/{documentId}
```

## Backward Compatibility

All changes maintain backward compatibility:
- Legacy `EquipmentDocRole` is aliased to `DocumentRole`
- `mapRoleToKind` handles both old (1-7) and new (10-16) enum values
- `mapKindToRole` supports both old and new stringified enum values
- Existing code using `EquipmentDocRole` will continue to work

## Next Steps

To complete the document management system update:

1. **WorkOrder Attachments**: Update work order attachment UI to use new `DocumentRole` values (50-59)
2. **Driver Documents**: Implement driver document management UI using `DocumentRole` values (30-49)
3. **Document Upload Flow**: Consider updating the general document upload to use the new two-step process
4. **Testing**: Thoroughly test document upload, viewing, and deletion for all entity types

## Migration Notes

- Existing documents with old enum values (1-7) will continue to work
- New documents will use the new enum values (10-16 for equipment)
- The backend should handle both old and new enum values during the transition period
