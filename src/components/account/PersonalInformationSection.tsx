
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, Camera } from "lucide-react";

interface PersonalInformationSectionProps {
  name: string;
  setName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  industryName: string;
  photoUrl?: string;
  onPhotoChange?: (file: File) => void;
}

const PersonalInformationSection = ({
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  companyName,
  setCompanyName,
  photoUrl,
  onPhotoChange,
}: PersonalInformationSectionProps) => {
  const formatPhoneNumber = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(
      6,
      10
    )}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setPhone(formattedPhoneNumber);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      onPhotoChange(file);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6 space-y-8 w-full">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
          <User className="w-5 h-5 text-slate-400" />
          Account Information
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-2 ml-9">
          Update your profile details
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Profile Picture Placeholder */}
        <div className="flex-shrink-0 relative group">
          <div className="w-32 h-32 bg-slate-100 rounded-full flex flex-col items-center justify-center border-4 border-white shadow-lg relative overflow-hidden">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-300 mb-2" />
            )}
            <label htmlFor="photo-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-8 h-8 text-white" />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <label htmlFor="photo-upload" className="block text-xs font-bold text-blue-600 mt-3 text-center w-full hover:underline cursor-pointer">
            Upload Photo
          </label>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <div className="space-y-3">
            <Label htmlFor="name" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="email" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled
              className="rounded-2xl border-slate-200 py-6 font-bold text-slate-500 bg-slate-50"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="phone" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="Enter phone number"
              maxLength={14}
              className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="company" className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="rounded-2xl border-slate-200 py-6 font-bold text-slate-700 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInformationSection;
