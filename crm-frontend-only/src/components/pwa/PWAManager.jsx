import { useEffect, useState } from 'react'
import { Download, X, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PWAManager() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [showInstallPrompt, setShowInstallPrompt] = useState(false)
    const [isOnline, setIsOnline] = useState(navigator.onLine)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault()
            setDeferredPrompt(e)
            // Show prompt after 30 seconds
            setTimeout(() => setShowInstallPrompt(true), 30000)
        }

        // Listen for app installed
        const handleAppInstalled = () => {
            setIsInstalled(true)
            setShowInstallPrompt(false)
            toast.success('تم تثبيت التطبيق بنجاح! 🎉')
        }

        // Listen for online/offline
        const handleOnline = () => {
            setIsOnline(true)
            toast.success('تم الاتصال بالإنترنت ✅')
        }

        const handleOffline = () => {
            setIsOnline(false)
            toast.error('لا يوجد اتصال بالإنترنت ⚠️')
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.addEventListener('appinstalled', handleAppInstalled)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === 'accepted') {
            console.log('User accepted install')
        }

        setDeferredPrompt(null)
        setShowInstallPrompt(false)
    }

    if (isInstalled) return null

    return (
        <>
            {/* Install Prompt */}
            {showInstallPrompt && (
                <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 z-50 animate-slide-up">
                    <button
                        onClick={() => setShowInstallPrompt(false)}
                        className="absolute top-2 left-2 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <div className="flex items-start gap-3 mt-2">
                        <div className="flex-shrink-0">
                            <Download className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">
                                ثبّت التطبيق على جهازك
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                                احصل على تجربة أفضل مع إمكانية العمل بدون إنترنت
                            </p>
                            <button
                                onClick={handleInstallClick}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                تثبيت الآن
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Online/Offline Indicator */}
            {!isOnline && (
                <div className="fixed top-4 left-4 z-50">
                    <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
                        <WifiOff className="h-4 w-4" />
                        <span className="text-sm font-medium">وضع عدم الاتصال</span>
                    </div>
                </div>
            )}
        </>
    )
}
