import { useEffect } from 'react'
import toast from 'react-hot-toast'

// رسائل تحفيزية بالمصري 🎉
const motivationalMessages = [
    // تحفيزية عامة 🚀
    '🔥 ماشي يا بطل! شغلك ناااار النهارده!',
    '⭐ أنت نجم الفريق! كمل كده!',
    '💯 مجهودك واضح وبيفرق! ربنا يباركلك!',
    '🎯 كل عميل بتضيفه = نجاح جديد! يلا!',
    '💪 أنت قدها وقدود! استمر!',
    '🌟 شغلك محترم جداً! فخورين بيك!',
    '🚀 ماشي صح! كمل على البركة!',
    '⚡ طاقتك عالية النهارده! حلو أوي!',

    // تشجيعية 💪
    '💚 متستسلمش! أنت قريب من الهدف!',
    '🌈 كل يوم أحسن من اللي قبله! ماشي تمام!',
    '🔋 خد نفس عميق وكمل! أنت قدها!',
    '🎯 الهدف قريب! يلا نوصله سوا!'
]

// Hook للرسائل التحفيزية
export const useMotivationalMessages = () => {
    useEffect(() => {
        // اختيار رسالة عشوائية
        const getRandomMessage = () => {
            const randomIndex = Math.floor(Math.random() * motivationalMessages.length)
            return motivationalMessages[randomIndex]
        }

        // عرض رسالة تحفيزية
        const showMotivationalMessage = () => {
            const message = getRandomMessage()
            toast.success(message, {
                duration: 5000, // 5 ثواني
                position: 'top-center',
                style: {
                    background: '#10B981',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    padding: '16px 24px',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)'
                },
                icon: '🎉'
            })
        }

        // عرض أول رسالة بعد 5 ثواني من فتح الصفحة (للاختبار)
        const initialTimeout = setTimeout(() => {
            showMotivationalMessage()
        }, 5000) // 5 ثواني

        // عرض رسالة كل 30 دقيقة
        const interval = setInterval(() => {
            showMotivationalMessage()
        }, 30 * 60 * 1000) // 30 دقيقة

        // Cleanup
        return () => {
            clearTimeout(initialTimeout)
            clearInterval(interval)
        }
    }, [])
}

export default useMotivationalMessages
