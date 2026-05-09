/**
 * src/components/solana/LawyerRegistrationForm.tsx
 *
 * Allows a lawyer to register their on-chain profile.
 * Requires wallet to have >= 1 SOL (checked by program).
 */

import { useState } from "react";
import { Loader2, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { useMercosuria } from "@/hooks/useMercosuria";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const JURISDICTIONS = [
  "Argentina",
  "Brazil",
  "Paraguay",
  "Uruguay",
  "MERCOSUR (Regional)",
  "EU-MERCOSUR",
  "Other",
];

const SPECIALIZATIONS = [
  "Trade Law",
  "Commercial Law",
  "Labor Law",
  "Consumer Protection",
  "Intellectual Property",
  "Regulatory Compliance",
  "MERCOSUR Arbitration",
  "Contract Law",
  "Other",
];

interface LawyerRegistrationFormProps {
  onSuccess?: (tx: string) => void;
}

export function LawyerRegistrationForm({ onSuccess }: LawyerRegistrationFormProps) {
  const { registerLawyer, connected } = useMercosuria();

  const [name, setName] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [jurisdiction, setJurisdiction] = useState("MERCOSUR (Regional)");
  const [specialization, setSpecialization] = useState("Trade Law");
  const [hourlyRateSOL, setHourlyRateSOL] = useState("0.05");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTx, setSuccessTx] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessTx(null);

    if (!name.trim()) { setError("Full name is required."); return; }
    if (!barNumber.trim()) { setError("Bar number is required."); return; }
    const rate = parseFloat(hourlyRateSOL);
    if (isNaN(rate) || rate <= 0) { setError("Hourly rate must be positive."); return; }

    setLoading(true);
    try {
      const tx = await registerLawyer({
        name: name.trim(),
        barNumber: barNumber.trim(),
        jurisdiction,
        specialization,
        hourlyRateSOL: rate,
      });
      setSuccessTx(tx);
      onSuccess?.(tx);
    } catch (err: any) {
      const msg = err?.message ?? "";
      if (msg.includes("InsufficientStake")) {
        setError("You need at least 1 SOL in your wallet to register as a lawyer.");
      } else {
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-emerald-600" />
          Register as a Lawyer
        </CardTitle>
        <CardDescription>
          Your profile will be stored on-chain. Requires at least 1 SOL staked in your wallet as collateral.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="María González"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={128}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barNumber">Bar Number</Label>
            <Input
              id="barNumber"
              placeholder="ARG-2019-4821"
              value={barNumber}
              onChange={(e) => setBarNumber(e.target.value)}
              maxLength={32}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Jurisdiction</Label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j} value={j}>{j}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Specialization</Label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIALIZATIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rate">Hourly Rate (SOL)</Label>
            <Input
              id="rate"
              type="number"
              step="0.001"
              min="0.001"
              placeholder="0.05"
              value={hourlyRateSOL}
              onChange={(e) => setHourlyRateSOL(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              This is your advertised rate — clients can negotiate specific fees per case.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successTx && (
            <Alert className="border-emerald-600 bg-emerald-50">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Profile created!{" "}
                <a
                  href={`https://explorer.solana.com/tx/${successTx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  View transaction
                </a>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={loading || !connected}
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering…</>
            ) : (
              "Register On-Chain"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
