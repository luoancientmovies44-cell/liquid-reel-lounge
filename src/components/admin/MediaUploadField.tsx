import { Input } from "@/components/ui/input";

interface Props {
  id: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  placeholder?: string;
  // Existing callers retain their field metadata; no file-upload behavior is attached.
  scope?: string;
  folder?: string;
  accept?: string;
  video?: boolean;
}

export function MediaUploadField({ id, value, onChange, required, placeholder }: Props) {
  return (
    <Input
      id={id}
      type="url"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      required={required}
      placeholder={placeholder || "https://..."}
    />
  );
}
