'use client';

import { PasswordForm } from './password-form';
import { SessionsCard } from './sessions-card';
import { SettingsPanelHead } from './settings-panel-head';
import { DeleteAccountDialog } from './delete-account-dialog';

/**
 * "Login & security" section — groups the former Profile-tab password
 * and active-sessions cards into their own dedicated home.
 */
export function SecurityPanel() {
  return (
    <section className="max-w-2xl animate-in fade-in-50 duration-200">
      <SettingsPanelHead
        title="Login & security"
        description="Change your password and sign out of your devices. These keep your account safe."
      />
      <div className="space-y-8">
        <div className="space-y-4">
          <PasswordForm />
          <SessionsCard />
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:p-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold text-destructive">Danger Zone</h3>
              <p className="mt-1 text-sm text-foreground/80">
                Permanently delete your account and all of your data. This action cannot be undone.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </div>
      </div>
    </section>
  );
}
