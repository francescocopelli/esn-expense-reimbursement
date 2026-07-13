import { redirect } from 'next/navigation'

// Legacy route — redirect to current member dashboard
export default function MemberRedirect() {
  redirect('/dashboard/my_reimbursement')
}
