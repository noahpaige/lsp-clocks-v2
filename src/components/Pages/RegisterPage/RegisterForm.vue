<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToaster } from "@/composables/useToaster";
import { ref } from "vue";

const { emitToast } = useToaster();
const username = ref("");
const password = ref("");
const confirmPassword = ref("");

const onClickCACIRegister = () => {
  emitToast({
    title: "CACI Register -- not implemented yet.",
    type: "info",
    deliverTo: "all",
  });
};

const onClickRegisterSubmit = () => {
  if (password.value !== confirmPassword.value) {
    emitToast({
      title: "Passwords do not match.",
      type: "error",
      deliverTo: "all",
    });
    return;
  }

  emitToast({
    title: `Register -- not implemented yet. username: ${username.value}`,
    type: "info",
    deliverTo: "all",
  });
};

const onClickLoginInstead = () => {
  emitToast({
    title: "Login page link clicked -- not implemented yet.",
    type: "info",
    deliverTo: "all",
  });
};

const onClickTerms = () => {
  emitToast({
    title: "Terms of Service -- not implemented yet.",
    type: "info",
    deliverTo: "all",
  });
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <Card>
      <CardHeader class="text-center">
        <CardTitle class="text-xl"> Create an account </CardTitle>
        <CardDescription> Register with your CACI account </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div class="grid gap-6">
            <div class="flex flex-col gap-4">
              <Button variant="outline" class="w-full" @click="onClickCACIRegister"> Register with CACI </Button>
            </div>
            <div
              class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
            >
              <span class="relative z-10 bg-background px-2 text-muted-foreground"> Or continue with </span>
            </div>
            <div class="grid gap-6">
              <div class="grid gap-2">
                <Label html-for="username">Username</Label>
                <Input id="username" v-model="username" type="text" required />
              </div>
              <div class="grid gap-2">
                <Label html-for="password">Password</Label>
                <Input id="password" v-model="password" type="password" required />
              </div>
              <div class="grid gap-2">
                <Label html-for="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" v-model="confirmPassword" type="password" required />
              </div>
              <Button class="w-full" @click="onClickRegisterSubmit"> Register </Button>
            </div>
            <div class="text-center text-sm">
              Already have an account?
              <a href="#" class="underline underline-offset-4" @click="onClickLoginInstead"> Login </a>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
    <div
      class="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary"
    >
      By clicking continue, you agree to our <a href="#" @click="onClickTerms">Terms of Service</a> and
      <a href="#" @click="onClickTerms">Privacy Policy</a>.
    </div>
  </div>
</template>
