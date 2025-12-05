import { Home, Users, UserPlus, Bell, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const BottomNav = () => {
    const navigate = useNavigate()
    const location = useLocation()

    const navItems = [
        { icon: Home, label: 'الرئيسية', path: '/dashboard' },
        { icon: UserPlus, label: 'محتملين', path: '/leads' },
        { icon: Users, label: 'عملاء', path: '/clients' },
        { icon: Bell, label: 'مهام', path: '/tasks' },
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
                {navItems.map(({ icon: Icon, label, path }) => (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`flex flex-col items-center py-2 px-1 transition-all duration-200 ${isActive(path)
                                ? 'text-blue-600'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-xs mt-1">{label}</span>
                    </button>
                ))}
            </div>
        </nav>
    )
}

export default BottomNav
