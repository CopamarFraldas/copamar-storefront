import { Badge } from "@medusajs/ui"

const PaymentTest = ({ className }: { className?: string }) => {
  return (
    <Badge color="orange" className={className}>
      <span className="font-semibold">Atenção:</span> apenas para fins de
      teste.
    </Badge>
  )
}

export default PaymentTest
