import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LogOut, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [location, setLocation] = useState("");
const [company, setCompany] = useState("");
const [jobRole, setJobRole] = useState("");
const [quote, setQuote] = useState("");
const [avatarPath, setAvatarPath] = useState("");
const [skills, setSkills] = useState("");
const [certifications, setCertifications] = useState("");
const [techUsed, setTechUsed] = useState("");
const [extraCurricular, setExtraCurricular] = useState("");
  useEffect(() => {
  getCurrentUser().then((user) => {
    setCurrentUser(user);
  });
}, []);
  const avatar =
  photoPreview ||
  avatarPath ||
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

const [career, setCareer] = useState<CareerEntry[]>([]);
useEffect(() => {
  if (!currentUser?.id || role !== "alumni") return;

  const loadCareerPath = async () => {
    const { data, error } = await supabase
      .from("career_path")
      .select("*")
      .eq("alumni_id", currentUser.id)
      .order("year");

    if (error) {
      console.error(error);
      return;
    }

    setCareer(
      (data || []).map((item) => ({
        year: String(item.year),
        company: item.company,
        role: item.job_role,
      }))
    );
  };

  loadCareerPath();
}, [currentUser, role]);
useEffect(() => {
  if (!currentUser?.id || role !== "alumni") return;

  const loadProfile = async () => {
    const { data: alumni } = await supabase
      .from("alumni")
      .select("*")
      .eq("id", currentUser.id)
      .single();

    if (alumni) {
      setLocation(alumni.location || "");
      setCompany(alumni.current_company || "");
      setJobRole(alumni.current_job_role || "");
      setQuote(alumni.quote || "");
      setAvatarPath(alumni.avatar_path || "");
    }


    const { data: skillsData } = await supabase
      .from("alumni_skills")
      .select("skill")
      .eq("alumni_id", currentUser.id);

    setSkills(
      (skillsData || []).map((s) => s.skill).join(", ")
    );

    const { data: certData } = await supabase
      .from("alumni_certifications")
      .select("certification")
      .eq("alumni_id", currentUser.id);

    setCertifications(
      (certData || []).map((c) => c.certification).join(", ")
    );

    const { data: techData } = await supabase
      .from("alumni_tech_used")
      .select("technology")
      .eq("alumni_id", currentUser.id);

    setTechUsed(
      (techData || []).map((t) => t.technology).join(", ")
    );

    const { data: extraData } = await supabase
      .from("alumni_extra_curricular")
      .select("activity")
      .eq("alumni_id", currentUser.id);

    setExtraCurricular(
      (extraData || []).map((e) => e.activity).join(", ")
    );
  };

  loadProfile();
}, [currentUser, role]);

const saveProfile = async () => {
  if (!currentUser?.id) return;

  // Update alumni table
  const { error: alumniError } = await supabase
    .from("alumni")
    .update({
      location,
      current_company: company,
      current_job_role: jobRole,
      quote,
    })
    .eq("id", currentUser.id);

  if (alumniError) {
    toast.error(alumniError.message);
    return;
  }

  // Skills
  await supabase
    .from("alumni_skills")
    .delete()
    .eq("alumni_id", currentUser.id);

  const skillRows = skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((skill) => ({
      alumni_id: currentUser.id,
      skill,
    }));

  if (skillRows.length) {
    await supabase.from("alumni_skills").insert(skillRows);
  }

  // Certifications
  await supabase
    .from("alumni_certifications")
    .delete()
    .eq("alumni_id", currentUser.id);

  const certRows = certifications
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((certification) => ({
      alumni_id: currentUser.id,
      certification,
    }));

  if (certRows.length) {
    await supabase.from("alumni_certifications").insert(certRows);
  }

  // Tech Used
  await supabase
    .from("alumni_tech_used")
    .delete()
    .eq("alumni_id", currentUser.id);

  const techRows = techUsed
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((technology) => ({
      alumni_id: currentUser.id,
      technology,
    }));

  if (techRows.length) {
    await supabase.from("alumni_tech_used").insert(techRows);
  }

  // Extra Curricular
  await supabase
    .from("alumni_extra_curricular")
    .delete()
    .eq("alumni_id", currentUser.id);

  const extraRows = extraCurricular
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)
    .map((activity) => ({
      alumni_id: currentUser.id,
      activity,
    }));

  if (extraRows.length) {
    await supabase.from("alumni_extra_curricular").insert(extraRows);
  }

  // Career Path
  await supabase
    .from("career_path")
    .delete()
    .eq("alumni_id", currentUser.id);

  const careerRows = career.map((c) => ({
    alumni_id: currentUser.id,
    year: Number(c.year),
    company: c.company,
    job_role: c.role,
  }));

  if (careerRows.length) {
    await supabase.from("career_path").insert(careerRows);
  }

  toast.success("Profile updated");
  setOpen(false);
};

const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];

  console.log("CURRENT USER:", currentUser);
  console.log("FILE:", file);

  if (!file) {
    toast.error("No file selected");
    return;
  }

  if (!currentUser) {
    toast.error("User not logged in");
    console.log("CURRENT USER IS NULL");
    return;
  }

  try {
    const fileExt = file.name.split(".").pop() || "jpg";

    // TEMPORARY TEST PATH
    const filePath = `${currentUser.id}-${Date.now()}.${fileExt}`;

    console.log("FILE PATH:", filePath);

    const { data: uploadData, error: uploadError } =
      await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: "3600",
        });

    console.log("UPLOAD DATA:", uploadData);
    console.log("UPLOAD ERROR:", uploadError);

    if (uploadError) {
      alert(JSON.stringify(uploadError, null, 2));
      toast.error(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = data.publicUrl;

    console.log("AVATAR URL:", avatarUrl);

    let updateError = null;

    if (role === "student") {
      const result = await supabase
        .from("students")
        .update({ avatar_path: avatarUrl })
        .eq("id", currentUser.id);

      updateError = result.error;
    } else {
      const result = await supabase
        .from("alumni")
        .update({ avatar_path: avatarUrl })
        .eq("id", currentUser.id);

      updateError = result.error;
    }

    console.log("UPDATE ERROR:", updateError);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    setPhotoPreview(avatarUrl);
    setAvatarPath(avatarUrl);
    toast.success("Photo uploaded");
  } catch (err) {
    console.error("CATCH ERROR:", err);
    toast.error("Upload failed");
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
<Field
  label="Location"
  value={location}
  onChange={(e) => setLocation(e.target.value)}
/>              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field
  label="Current Company"
  value={company}
  onChange={(e) => setCompany(e.target.value)}
/>
                <Field
  label="Current Job Role"
  value={jobRole}
  onChange={(e) => setJobRole(e.target.value)}
/>
              </div>
<Field
  label="Skills (comma-separated)"
  value={skills}
  onChange={(e) => setSkills(e.target.value)}
/>              
<Field
  label="Tech Used"
  value={techUsed}
  onChange={(e) => setTechUsed(e.target.value)}
/>
              <Field
  label="Extra Curricular"
  value={extraCurricular}
  onChange={(e) => setExtraCurricular(e.target.value)}
/>
              <Field
  label="Certifications"
  value={certifications}
  onChange={(e) => setCertifications(e.target.value)}
/>
              <div className="grid gap-2">
                <Label>Personal Quote</Label>
                <Textarea
  value={quote}
  onChange={(e) => setQuote(e.target.value)}
/>
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
<Button onClick={saveProfile}>
  Save changes
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

 