import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";

type Props = {
  role: "student" | "alumni";
  name: string;
  avatarSeed: string;
  extraNav?: ReactNode;
};

type CareerEntry = { year: string; company: string; role: string };

export function TopNav({ role, name, avatarSeed, extraNav }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const avatar =
    photoPreview ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  const [career, setCareer] = useState<CareerEntry[]>([
    { year: "2018", company: "Flipkart", role: "SWE Intern" },
    { year: "2019", company: "Razorpay", role: "SDE-1" },
    { year: "2022", company: "Google", role: "SDE-2" },
    { year: "2024", company: "Google", role: "Senior SWE" },
  ]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhotoPreview(URL.createObjectURL(f));
  };

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl px-5 py-3">
        <div className="flex items-center gap-2 select-none">
          <BrandLogo className="h-9 w-9 rounded-xl" />
          <span className="font-semibold tracking-tight">Alumni Connect</span>
        </div>
        <div className="flex items-center gap-3">
          {extraNav}
          <span className="hidden text-sm text-muted-foreground sm:block">
            {role === "student" ? "Student" : "Alumni"} · {name}
          </span>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen(true)}
            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-elegant"
          >
            <img src={avatar} alt={name} className="h-full w-full" />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
              <Pencil className="h-2.5 w-2.5" />
            </span>
          </motion.button>
          <Button variant="ghost" size="icon" onClick={() => { toast.success("Logged out"); navigate({ to: "/" }); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit your profile</DialogTitle>
          </DialogHeader>

          {/* Photo uploader (shared) */}
          <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-3">
            <div className="h-16 w-16 overflow-hidden rounded-full ring-2 ring-white shadow-elegant">
              <img src={avatar} alt="" className="h-full w-full object-cover" />
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
                <Upload className="h-4 w-4" /> Change photo
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
          </div>

          {role === "student" ? (
            <div className="space-y-3 pt-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input defaultValue={name} />
              </div>
              <div className="grid gap-2">
                <Label>Current Semester</Label>
                <Input defaultValue="Semester 5" />
              </div>

              {/* Locked / read-only fields */}
              <div className="mt-4 space-y-3 rounded-xl border border-dashed border-border bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  🔒 Locked — contact admin to update
                </p>
                <ReadOnly label="Batch" value="2024" />
                <ReadOnly label="Department" value="Computer Science" />
                <ReadOnly label="Roll Number" value="CS21B1042" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" defaultValue={name} />
                <Field label="Location" defaultValue="Bangalore, IN" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current Company" defaultValue="Google" />
                <Field label="Current Job Role" defaultValue="Senior SWE" />
              </div>
              <Field label="Skills (comma-separated)" defaultValue="System Design, Leadership, Distributed Systems" />
              <Field label="Tech Used" defaultValue="Go, Kubernetes, GCP, Python" />
              <Field label="Extra Curricular" defaultValue="Coding Club President, Hackathon Organizer" />
              <Field label="Certifications" defaultValue="GCP Architect, Kubernetes CKA" />
              <div className="grid gap-2">
                <Label>Personal Quote</Label>
                <Textarea defaultValue="Mentor 5+ juniors annually. Pay it forward." rows={2} />
              </div>

              {/* Dynamic Career Path editor */}
              <div className="mt-4 space-y-3 rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Career Path Timeline</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setCareer((c) => [...c, { year: "", company: "", role: "" }])}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-3">
                  {career.map((entry, i) => (
                    <div key={i} className="grid grid-cols-[80px_1fr_1fr_auto] items-end gap-2">
                      <div className="grid gap-1">
                        <Label className="text-xs">Year</Label>
                        <Input
                          placeholder="2024"
                          value={entry.year}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCareer((c) => c.map((x, j) => (j === i ? { ...x, year: v } : x)));
                          }}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Company</Label>
                        <Input
                          placeholder="Google"
                          value={entry.company}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCareer((c) => c.map((x, j) => (j === i ? { ...x, company: v } : x)));
                          }}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-xs">Job Role</Label>
                        <Input
                          placeholder="SDE-2"
                          value={entry.role}
                          onChange={(e) => {
                            const v = e.target.value;
                            setCareer((c) => c.map((x, j) => (j === i ? { ...x, role: v } : x)));
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setCareer((c) => c.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => { setOpen(false); toast.success("Profile updated"); }}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input {...props} />
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} readOnly disabled className="cursor-not-allowed bg-muted/80 text-foreground/70" />
    </div>
  );
}
