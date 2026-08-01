import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Bell,
  Check,
  Globe,
  Laptop,
  Lock,
  Monitor,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";
import { useAppStore, notify } from "@/store/appStore";
import { useI18n } from "@/hooks/useI18n";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Switch } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { CURRENCIES } from "@/constants";
import { LANGUAGES } from "@/constants/i18n";
import { cn } from "@/utils/cn";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.string().trim().min(2, "Role is required"),
  company: z.string().trim().min(2, "Company is required"),
});

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "New password must be at least 8 characters"),
    confirm: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.next === values.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

const TABS = [
  { value: "profile", label: "Profile", icon: User },
  { value: "preferences", label: "Preferences", icon: Palette },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "security", label: "Security", icon: ShieldCheck },
];

const THEME_OPTIONS = [
  { value: "light", label: "Light", description: "Bright and airy", icon: Sun },
  { value: "dark", label: "Dark", description: "Easy on the eyes", icon: Moon },
  { value: "system", label: "System", description: "Follow your OS", icon: Monitor },
];

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState("profile");

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Manage your workspace, preferences and security."
        crumbs={[t("nav.settings")]}
      />
      <Tabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="Settings sections" />

      <div className="mt-4 max-w-3xl">
        {tab === "profile" && <ProfileSection />}
        {tab === "preferences" && <PreferencesSection />}
        {tab === "notifications" && <NotificationsSection />}
        {tab === "security" && <SecuritySection />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const profile = useAppStore((state) => state.profile);
  const updateProfile = useAppStore((state) => state.updateProfile);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  const onSubmit = (values) => {
    setSaving(true);
    window.setTimeout(() => {
      updateProfile(values);
      setSaving(false);
      notify({ type: "success", title: "Profile updated" });
    }, 600);
  };

  return (
    <Card>
      <CardHeader
        title="Profile"
        subtitle="This information appears across your workspace."
        action={
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand to-violet-500 text-sm font-bold text-white">
            {profile.name
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)}
          </span>
        }
      />
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" error={errors.name?.message} {...register("name")} />
            <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
            <Input label="Role" error={errors.role?.message} {...register("role")} />
            <Input label="Company" error={errors.company?.message} {...register("company")} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function PreferencesSection() {
  const { t, locale } = useI18n();
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  const currency = useAppStore((state) => state.currency);
  const setCurrency = useAppStore((state) => state.setCurrency);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title={t("common.theme")} subtitle="How Meridian looks on this device." />
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map((option) => {
              const active = theme === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "relative flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left transition-all",
                    active
                      ? "border-brand bg-brand-soft ring-1 ring-brand"
                      : "border-line bg-surface hover:border-line-strong"
                  )}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                      <Check size={12} aria-hidden="true" />
                    </span>
                  )}
                  <option.icon size={18} className={active ? "text-brand" : "text-muted"} aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{option.label}</span>
                    <span className="block text-xs text-muted">{option.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Regional" subtitle="Currency and language for all formatting." />
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={t("common.currency")}
              value={currency}
              onChange={(event) => {
                setCurrency(event.target.value);
                notify({ type: "success", title: `Currency set to ${event.target.value}` });
              }}
            >
              {CURRENCIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.code} — {option.label}
                </option>
              ))}
            </Select>
            <Select
              label={t("common.language")}
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                notify({ type: "success", title: `Language set to ${LANGUAGES.find((l) => l.code === event.target.value)?.label}` });
              }}
            >
              {LANGUAGES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-3 text-xs text-faint">
            Number formatting follows the selected language — e.g. {locale === "es-ES" ? "12.345,67" : "12,345.67"}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  const prefs = useAppStore((state) => state.notificationPrefs);
  const toggle = useAppStore((state) => state.toggleNotification);

  const rows = [
    { key: "bills", label: "Bill reminders", description: "3 days before a recurring bill is due." },
    { key: "budgetAlerts", label: "Budget alerts", description: "When a category passes 85% of its limit." },
    { key: "weeklyDigest", label: "Weekly digest", description: "A Sunday summary of the week's cash flow." },
    { key: "productNews", label: "Product news", description: "New features and product updates from Meridian." },
  ];

  return (
    <Card>
      <CardHeader title="Notifications" subtitle="Choose what lands in your inbox and notification bell." />
      <CardContent>
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((row) => (
            <li key={row.key} className="py-4 first:pt-0 last:pb-0">
              <Switch
                checked={prefs[row.key]}
                onChange={() => {
                  toggle(row.key);
                  notify({ type: "success", title: `${row.label} ${prefs[row.key] ? "disabled" : "enabled"}` });
                }}
                label={row.label}
                description={row.description}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const [saving, setSaving] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });

  const onSubmit = () => {
    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      reset();
      notify({ type: "success", title: "Password changed" });
    }, 700);
  };

  const sessions = [
    { id: "s1", device: "Chrome on macOS", location: "San Francisco, US", current: true },
    { id: "s2", device: "Safari on iPhone", location: "San Francisco, US", current: false },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader title="Password" subtitle="Use at least 8 characters with a mix of letters and numbers." />
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Current password" type="password" error={errors.current?.message} {...register("current")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="New password" type="password" error={errors.next?.message} {...register("next")} />
              <Input label="Confirm new password" type="password" error={errors.confirm?.message} {...register("confirm")} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={saving} icon={Lock}>
                Change password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Two-factor authentication" subtitle="Add a second verification step when signing in." />
        <CardContent>
          <Switch
            checked={twoFactor}
            onChange={() => {
              setTwoFactor(!twoFactor);
              notify({ type: "success", title: twoFactor ? "Two-factor disabled" : "Two-factor enabled" });
            }}
            label="Require a one-time code"
            description="We'll ask for a code from your authenticator app on every new device."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Active sessions" subtitle="Devices currently signed in to your workspace." />
        <CardContent>
          <ul className="flex flex-col divide-y divide-line">
            {sessions.map((session) => (
              <li key={session.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-elevated text-muted">
                  <Laptop size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{session.device}</span>
                  <span className="block text-xs text-faint">{session.location}</span>
                </span>
                {session.current ? (
                  <span className="text-xs font-medium text-success">This device</span>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => notify({ type: "info", title: "Session revoked", message: `${session.device} was signed out.` })}
                  >
                    Revoke
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
