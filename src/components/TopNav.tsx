import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, Pencil, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";
import type { UserProfile } from "@/lib/types";
import { logout } from "@/lib/auth";
import { getAvatarPublicUrl, uploadAvatar } from "@/lib/storage";
import { fetchAlumniProfile, updateAlumniProfile } from "@/lib/api/alumni";
import { assertSupabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  role: "student" | "alumni";
  profile: UserProfile;
  extraNav?: ReactNode;
};

type CareerEntry = { year: string; company: string; role: string };

export function TopNav({ role, profile, extraNav }: Props) {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const avatar =
    photoPreview || getAvatarPublicUrl(profile.photoUrl, profile.id);

  const [fullName, setFullName] = useState(profile.fullName);
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [tech, setTech] = useState("");
  const [certifications, setCertifications] = useState("");
  const [bio, setBio] = useState("");
  const [career, setCareer] = useState<CareerEntry[]>([]);
  const [semester, setSemester] = useState("");

  useEffect(() => {
    if (!open || role !== "alumni") return;
    setLoadingProfile(true);
    void fetchAlumniProfile(profile.id)
      .then((a) => {
        if (!a) return;
        setFullName(a.name);
        setLocation(a.location);
        setCompany(a.company);
        setJobTitle(a.role);
        setSkills(a.skills.join(", "));
        setTech(a.tech.join(", "));
        setCertifications(a.certifications.join(", "));
        setBio(a.bio);
        setCareer(a.careerPath.map((c) => ({ year: c.year, company: c.company, role: c.role })));
      })
      .finally(() => setLoadingProfile(false));
  }, [open, role, profile.id]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setPendingPhoto(f);
      setPhotoPreview(URL.createObjectURL(f));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logout failed");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (pendingPhoto) {
        await uploadAvatar(profile.id, pendingPhoto);
        setPendingPhoto(null);
      }

      if (role === "student") {
        const supabase = assertSupabase();
        await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
        const sem = parseInt(semester.replace(/\D/g, ""), 10);
        if (sem) {
          await supabase.from("students").update({ semester: sem }).eq("user_id", profile.id);
        }
      } else {
        await updateAlumniProfile(profile.id, {
          fullName,
          location,
          jobTitle,
          companyName: company,
          bio,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          tech: tech.split(",").map((t) => t.trim()).filter(Boolean),
          certifications: certifications.split(",").map((c) => c.trim()).filter(Boolean),
          careerPath: career,
        });
      }

      await refreshProfile();
      setOpen(false);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
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
            {role === "student" ? "Student" : "Alumni"} · {profile.fullName}
          </span>
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setOpen(true)}
            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-elegant"
          >
            <img src={avatar} alt={profile.fullName} className="h-full w-full object-cover" />
            <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-primary-foreground">
              <Pencil className="h-2.5 w-2.5" />
            </span>
          </motion.button>
          <Button variant="ghost" size="icon" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit your profile</DialogTitle>
          </DialogHeader>

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

          {loadingProfile && role === "alumni" ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
            </p>
          ) : role === "student" ? (
            <div className="space-y-3 pt-2">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Current Semester</Label>
                <Input
                  placeholder="5"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                />
              </div>
              <div className="mt-4 space-y-3 rounded-xl border border-dashed border-border bg-muted/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Locked — contact admin to update
                </p>
                <ReadOnly label="Roll Number" value={profile.rollNumber ?? "—"} />
                <ReadOnly label="Department Email" value={profile.departmentEmail ?? "—"} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Field label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Current Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                <Field label="Current Job Role" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <Field label="Skills (comma-separated)" value={skills} onChange={(e) => setSkills(e.target.value)} />
              <Field label="Tech Used" value={tech} onChange={(e) => setTech(e.target.value)} />
              <Field
                label="Certifications"
                value={certifications}
                onChange={(e) => setCertifications(e.target.value)}
              />
              <div className="grid gap-2">
                <Label>Personal Quote</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} />
              </div>

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
            <Button onClick={() => void handleSave()} disabled={saving || loadingProfile}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
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
