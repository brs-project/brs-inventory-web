import { BillDetailDrawer, type BillDetailDrawerProps } from './BillDetailDrawer'

export type BillDetailModalProps = BillDetailDrawerProps

export function BillDetailModal(props: BillDetailModalProps) {
  return <BillDetailDrawer {...props} />
}
