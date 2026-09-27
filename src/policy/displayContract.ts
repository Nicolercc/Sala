import { surfaces, type Surface } from "@/policy/visibility";

export const forbiddenPublicFields = ["firstName", "lastName", "dob", "reason", "arrivedAt", "fullName"] as const;

export const displayContracts: Record<
  Surface,
  {
    surface: string;
    purpose: string;
    allowedFields: readonly string[];
    forbiddenFields: readonly string[];
    proof: string[];
  }
> = {
  publicBoard: {
    surface: "Public waiting-room board",
    purpose: "Help a patient recognize their turn without exposing identifying or visit-specific details.",
    allowedFields: surfaces.publicBoard,
    forbiddenFields: forbiddenPublicFields,
    proof: [
      "Board route parses a serialized feed.",
      "Board route does not import the patient store or Patient type.",
      "Feed tests fail if direct patient fields enter the public payload."
    ]
  },
  staffQueue: {
    surface: "Staff queue",
    purpose: "Give front-desk staff enough context to manage arrival status and support the patient in person.",
    allowedFields: surfaces.staffQueue,
    forbiddenFields: ["unmaskedDob", "ssn", "phone", "email", "mrn"],
    proof: [
      "DOB is masked by the visibility policy.",
      "Synthetic fixtures are scanned for SSN, phone, email, and MRN-like patterns.",
      "No browser storage is used for patient data."
    ]
  }
};
