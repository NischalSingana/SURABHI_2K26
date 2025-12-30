import Link from "next/link"
import { FiArrowLeft } from "react-icons/fi"

interface ReturnButtonProps {
    href: string
    label: string
}
const ReturnButton = ({href, label}: ReturnButtonProps) => {
  return (
    <button className=' px-5 py-2 flex bg-white rounded-2xl text-black cursor-pointer'> 
     <Link className="flex items-center justify-center gap-1.5" href={href}><FiArrowLeft/>{label}</Link>
    </button>
  )
}

export default ReturnButton