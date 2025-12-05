import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ message = 'جاري التحميل...' }) => {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">{message}</p>
            </div>
        </div>
    )
}

export default LoadingSpinner
