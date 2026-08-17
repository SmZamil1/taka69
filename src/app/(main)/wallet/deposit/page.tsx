import { redirect } from "next/navigation";

export default function WalletDepositAliasPage() {
  redirect("/wallet?tab=deposit");
}
