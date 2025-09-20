import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Map, MapPin, Globe, Zap, RefreshCcw, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const WikiMapiaViewer = () => {
  console.log('🗺️ WikiMapia Viewer loaded!')
  
  const [isLoading, setIsLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [currentView, setCurrentView] = useState('damietta') // damietta, satellite, hybrid

  // تحميل WikiMapia
  useEffect(() => {
    const loadWikiMapia = () => {
      console.log('🌍 Loading WikiMapia for Damietta...')
      // تأخير بسيط لمحاكاة التحميل
      setTimeout(() => {
        setMapReady(true)
        setIsLoading(false)
        toast.success('🌍 تم تحميل خريطة دمياط التفاعلية!')
      }, 1500)
    }

    loadWikiMapia()
  }, [])

  const changeMapView = (view) => {
    setCurrentView(view)
    const viewNames = {
      damietta: 'عرض دمياط الجديدة',
      satellite: 'عرض القمر الصناعي',
      hybrid: 'العرض المدمج'
    }
    toast.success(`🔄 تم التحويل إلى ${viewNames[view]}`)
  }

  const openInWikiMapia = () => {
    // إحداثيات دمياط الجديدة
    const lat = 31.4165
    const lon = 31.8133
    const url = `https://wikimapia.org/#lang=ar&lat=${lat}&lon=${lon}&z=13&m=w`
    window.open(url, '_blank')
    toast.success('🌐 تم فتح WikiMapia في نافذة جديدة!')
  }

  const refreshMap = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      toast.success('🔄 تم تحديث الخريطة!')
    }, 1000)
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-500 mb-4" />
        <p className="text-lg text-gray-600">جاري تحميل WikiMapia لدمياط الجديدة...</p>
      </div>
    )
  }

  // إحداثيات ومعلومات مناطق دمياط
  const damietteLocations = {
    damietta: {
      name: 'دمياط الجديدة - المنطقة الرئيسية',
      lat: 31.4165,
      lon: 31.8133,
      zoom: 13,
      description: 'المنطقة السكنية والتجارية الرئيسية'
    },
    port: {
      name: 'ميناء دمياط الجديدة',
      lat: 31.5089,
      lon: 31.7969,
      zoom: 14,
      description: 'المنطقة الصناعية والميناء'
    },
    residential: {
      name: 'الأحياء السكنية',
      lat: 31.4000,
      lon: 31.8200,
      zoom: 15,
      description: 'المناطق السكنية الحديثة'
    }
  }

  const getWikiMapiaEmbedUrl = (location) => {
    const loc = damietteLocations[location]
    return `https://wikimapia.org/iframe/#lang=ar&lat=${loc.lat}&lon=${loc.lon}&z=${loc.zoom}&m=w&search=دمياط`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <Globe className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">خريطة دمياط الجديدة التفاعلية - WikiMapia</h2>
            <p className="text-purple-100">
              ✅ خريطة تفاعلية شاملة مع معلومات مفصلة عن كل منطقة
            </p>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-green-600">🌍 تحكم في العرض</h3>
          <div className="flex gap-2">
            <Button onClick={refreshMap} variant="outline" size="sm">
              <RefreshCcw className="h-4 w-4 mr-2" />
              تحديث
            </Button>
            <Button onClick={openInWikiMapia} variant="outline" size="sm" className="text-blue-600">
              <ExternalLink className="h-4 w-4 mr-2" />
              فتح في WikiMapia
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(damietteLocations).map(([key, location]) => (
            <Card key={key} className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
              currentView === key ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-green-300'
            }`} onClick={() => changeMapView(key)}>
              <div className="flex items-center gap-3 mb-2">
                <MapPin className={`h-5 w-5 ${currentView === key ? 'text-green-600' : 'text-gray-500'}`} />
                <h4 className="font-semibold text-sm">{location.name}</h4>
              </div>
              <p className="text-xs text-gray-600">{location.description}</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* WikiMapia Viewer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-green-600">🗺️ {damietteLocations[currentView].name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">مدعوم بـ</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">WikiMapia</span>
          </div>
        </div>
        
        <div className="relative h-[700px] border-2 border-green-200 rounded-lg overflow-hidden">
          <iframe
            src={getWikiMapiaEmbedUrl(currentView)}
            className="w-full h-full border-0"
            title={`خريطة ${damietteLocations[currentView].name}`}
            onLoad={() => console.log('WikiMapia loaded successfully')}
          />
          
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            🌍 خريطة تفاعلية
          </div>
          
          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs max-w-xs">
            <div className="flex items-center gap-2 mb-1">
              <Map className="h-3 w-3" />
              <span>ميزات WikiMapia:</span>
            </div>
            <ul className="text-xs space-y-1">
              <li>📍 معلومات تفصيلية لكل موقع</li>
              <li>🏢 عرض المباني والشركات</li>
              <li>📊 إحصائيات المنطقة</li>
              <li>🔍 بحث متقدم داخل الخريطة</li>
              <li>📸 صور حقيقية للمواقع</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Features */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-blue-600 mb-4">✨ مميزات WikiMapia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <Globe className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h4 className="font-bold text-blue-800">تغطية شاملة</h4>
            <p className="text-xs text-blue-600">جميع أنحاء دمياط الجديدة</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <MapPin className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h4 className="font-bold text-green-800">مواقع دقيقة</h4>
            <p className="text-xs text-green-600">إحداثيات GPS دقيقة</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <Zap className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <h4 className="font-bold text-purple-800">تحديث مستمر</h4>
            <p className="text-xs text-purple-600">بيانات محدثة باستمرار</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <ExternalLink className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h4 className="font-bold text-yellow-800">معلومات تفاعلية</h4>
            <p className="text-xs text-yellow-600">تفاصيل عن كل موقع</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default WikiMapiaViewer