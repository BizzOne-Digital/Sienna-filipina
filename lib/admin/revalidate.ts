import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/content/queries";

/** Makes saved admin changes visible on the storefront immediately. */
export function refreshStorefront() {
  revalidateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}
