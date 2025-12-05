import { Home, Users, Plus, Bell, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const BottomNav = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { icon: Home, label: 'الرئيسية', path: '/dashboard' },
        { icon: Users, label: 'العملاء', path: '/clients' },
        { icon: Plus, label: 'إضافة', path: '/quick-add', highlight: true },
        { icon: Bell, label: 'التنبيهات', path: '/notifications' },
        { icon: User, label: 'الملف', path: '/profile' }
    ]

    const isActive = (path) => {
        if (path === '/dashboard') {
            return location.pathname === '/' || location.pathname === '/dashboard'
        }
        return location.pathname.startsWith(path)
    }

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-bottom">
            <div className="grid grid-cols-5 gap-1 px-2">
                {navItems.map(({ icon: Icon, label, path, highlight }) => (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${isActive(path)
                                ? 'text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            } ${highlight ? 'relative' : ''}`}
                    >
                        {highlight && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                <Icon className="h-6 w-6 text-white" />
                            </div>
                        )}
                        {!highlight && <Icon className="h-6 w-6" />}
                        <span className={`text-xs mt-1 ${highlight ? 'mt-8' : ''}`}>{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    )
}

export default BottomNav
