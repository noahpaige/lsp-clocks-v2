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

const onClickCACILogin = () => {
  emitToast({
    title: "CACI Login -- not implemented yet.",
    type: "info",
    deliverTo: "all",
  });
};

const onClickLogin = () => {
  emitToast({
    title: `Login -- not implemented yet. username: ${username.value}, password: ${password.value}`,
    type: "info",
    deliverTo: "all",
  });
};

const onClickForgotPassword = () => {
  emitToast({
    title: "Forgot Password -- not implemented yet.",
    type: "info",
    deliverTo: "all",
  });
};

const onClickRegister = () => {
  emitToast({
    title: "Register -- not implemented yet.",
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
        <CardTitle class="text-xl"> Welcome back </CardTitle>
        <CardDescription> Login with your CACI account </CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div class="grid gap-6">
            <div class="flex flex-col gap-4">
              <Button variant="outline" class="w-full" @click="onClickCACILogin"> Login with CACI </Button>
            </div>
            <div
              class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
            >
              <span class="relative z-10 bg-background px-2 text-muted-foreground"> Or continue with </span>
            </div>
            <div class="grid gap-6">
              <div class="grid gap-2">
                <Label html-for="username">Username</Label>
                <Input id="username" v-model="username" type="username" required />
              </div>
              <div class="grid gap-2">
                <div class="flex items-center">
                  <Label html-for="password">Password</Label>
                  <a href="#" class="ml-auto text-sm underline-offset-4 hover:underline" @click="onClickForgotPassword">
                    Forgot your password?
                  </a>
                </div>
                <Input id="password" v-model="password" type="password" required />
              </div>
              <!-- <Button type="submit" class="w-full" @click="onClickLogin"> Login </Button> -->
              <Button class="w-full" @click="onClickLogin"> Login </Button>
            </div>
            <div class="text-center text-sm">
              Don't have an account?
              <a href="#" class="underline underline-offset-4" @click="onClickRegister"> Register </a>
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
