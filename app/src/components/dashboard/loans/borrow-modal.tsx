import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
// import { useChainId } from "wagmi";
import { formatUnits } from "viem";
import { useChains } from "wagmi";

import { Button } from "@/components/ui/button";
import { BaseDialogProps, Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
// import { assets } from "@/lib/assets";
import { Spinner } from "@/components/ui/spinner";
import { BorrowData, getBorrowSchema, useBorrow } from "@/lib/hooks/loans/use-borrow";
import { useGetBorrowAmount } from "@/lib/hooks/loans/use-get-borrow-amount";
import { Pool } from "@/lib/types";
import { APR_DECIMALS, LTV_DECIMALS } from "@/lib/utils";

interface BorrowModalProps extends BaseDialogProps {
  pool: Pool;
}

export function BorrowModal({ pool, open, onOpenChange }: BorrowModalProps) {
  // const chainId = useChainId();
  const chains = useChains();
  // const chainAssets = assets[chainId];

  const form = useForm<BorrowData>({
    resolver: zodResolver(getBorrowSchema(Number(pool.amount))),
    defaultValues: {
      collateralAmount: 0,
      // collateralAsset: chainAssets[0].address,
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = form;
  const collateralAmount = watch("collateralAmount");

  const {
    data: borrowAmount,
    error,
    isPending: isPendingGetBorrowAmount,
  } = useGetBorrowAmount({
    pool,
    collateralAmount: 0,
  });

  console.log("error: ", error);

  const { mutate: borrow, isPending } = useBorrow({
    pool,
  });

  const onSubmit = handleSubmit((data) => {
    borrow(data);
  });

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onOpenChange(false);
        reset();
      }}
      modal={true}
    >
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col px-6">
        <DialogTitle className="text-xl font-semibold">Borrow</DialogTitle>

        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Chain</div>
              <div className="font-medium">
                {chains.find((chain) => chain.id === pool.chainId)?.name}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Asset</div>
              <div className="font-medium">{pool.asset.symbol}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Interest Rate</div>
              <div className="font-medium">{formatUnits(pool.apr, APR_DECIMALS)}%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">LTV</div>
              <div className="font-medium">{formatUnits(pool.ltv, LTV_DECIMALS)}%</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Collateral Chain</div>
              <div className="font-medium">
                {chains.find((chain) => chain.id === pool.collateralChainId)?.name}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Collateral Asset</div>
              <div className="font-medium">{pool.collateralAsset.symbol}</div>
            </div>
            {/* <div className="flex items-center justify-between">
            <div className="text-muted-foreground">Collateral</div>
            <div className="font-medium">30 USDC</div>
          </div> */}
            <Separator className="my-3" />

            <div>
              <Label className="mb-2 block" htmlFor="name">
                Collateral Amount
              </Label>
              <Input
                id="name"
                type="number"
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="off"
                tabIndex={-1}
                step={0.01}
                disabled={isPending}
                {...register("collateralAmount", { valueAsNumber: true })}
              />
              {errors?.collateralAmount && (
                <p className="px-1 text-xs text-destructive">{errors.collateralAmount.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Borrow Amount</div>
              <div className="font-medium">
                {isPendingGetBorrowAmount ? (
                  <Spinner />
                ) : (
                  `${formatUnits(borrowAmount || BigInt(0), pool.asset.decimals)} ${pool.asset.symbol}`
                )}
              </div>
              {/* TODO: Calculate borrow amount based on collateral amount */}
            </div>

            {/* <FormField
            control={form.control}
            name="collateralAsset"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="mb-2 block">Collateral Asset</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {chainAssets.map((asset) => (
                      <SelectItem key={asset.symbol} value={asset.address}>
                        {asset.name} ({asset.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          /> */}

            <div className="flex items-center justify-end gap-2">
              <Button
                disabled={isPending}
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button disabled={isPending} loading={isPending}>
                Borrow
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
