import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Button } from "#/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { authClient } from "#/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
  redirectTo: string;
};

function firstError(errors: Array<unknown>) {
  const error = errors[0];

  if (!error) {
    return null;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return String(error);
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const router = useRouter();
  const [authError, setAuthError] = useState<string | null>(null);
  const isSignUp = mode === "sign-up";
  const t = useTranslations("auth");

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setAuthError(null);

      const result = isSignUp
        ? await authClient.signUp.email({
            name: value.name,
            email: value.email,
            password: value.password,
          })
        : await authClient.signIn.email({
            email: value.email,
            password: value.password,
          });

      if (result.error) {
        setAuthError(result.error.message ?? t("authFailed"));
        return;
      }

      await router.invalidate();
      await router.navigate({ to: redirectTo });
    },
  });

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {isSignUp ? t("signUpTitle") : t("signInTitle")}
          </CardTitle>
          <CardDescription>
            {isSignUp ? t("signUpDesc") : t("signInDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              {authError ? (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              ) : null}

              {isSignUp ? (
                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      value.trim().length < 2 ? t("nameMin") : undefined,
                  }}
                >
                  {(field) => {
                    const error = firstError(field.state.meta.errors);

                    return (
                      <Field data-invalid={!!error}>
                        <FieldLabel htmlFor={field.name}>
                          {t("name")}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          autoComplete="name"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                        />
                        <FieldError>{error}</FieldError>
                      </Field>
                    );
                  }}
                </form.Field>
              ) : null}

              <form.Field
                name="email"
                validators={{
                  onChange: ({ value }) =>
                    /^\S+@\S+\.\S+$/.test(value) ? undefined : t("emailValid"),
                }}
              >
                {(field) => {
                  const error = firstError(field.state.meta.errors);

                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>{t("email")}</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        autoComplete="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      <FieldError>{error}</FieldError>
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) =>
                    value.length < 8 ? t("passwordMin") : undefined,
                }}
              >
                {(field) => {
                  const error = firstError(field.state.meta.errors);

                  return (
                    <Field data-invalid={!!error}>
                      <FieldLabel htmlFor={field.name}>
                        {t("password")}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        autoComplete={
                          isSignUp ? "new-password" : "current-password"
                        }
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                      />
                      <FieldError>{error}</FieldError>
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>

            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : null}
                  {isSignUp ? t("signUp") : t("signIn")}
                </Button>
              )}
            </form.Subscribe>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? t("alreadyHaveAccount") : t("needAccount")}{" "}
              <Link
                to={isSignUp ? "/sign-in" : "/sign-up"}
                search={{ redirect: redirectTo }}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {isSignUp ? t("signIn") : t("createOne")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
