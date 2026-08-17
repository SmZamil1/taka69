import { redirect } from "next/navigation";

export default function WalletWithdrawAliasPage() {
  redirect("/wallet?tab=withdraw");
}
