import React, { useState, useRef, useEffect } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Maximize, 
  Minimize, 
  Download, 
  Search,
  MapPin,
  Layers,
  Home,
  Info,
  X
} from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import toast from 'react-hot-toast'

const MapViewer = () => {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLayers, setShowLayers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArea, setSelectedArea] = useState(null)
  const [mapImageLoaded, setMapImageLoaded] = useState(false)
  const [mapImageError, setMapImageError] = useState(false)
  
  const mapContainerRef = useRef(null)
  const mapImageRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })

  // معلومات المناطق والمشاريع في دمياط الجديدة
  const mapAreas = [
    { id: 1, name: 'الحي الأول', x: 30, y: 20, projects: 5, units: 120 },
    { id: 2, name: 'الحي الثاني', x: 60, y: 30, projects: 8, units: 200 },
    { id: 3, name: 'الحي السكني', x: 40, y: 60, projects: 12, units: 350 },
    { id: 4, name: 'المنطقة التجارية', x: 70, y: 40, projects: 6, units: 80 },
    { id: 5, name: 'الكورنيش', x: 20, y: 80, projects: 4, units: 90 },
  ]

  const layers = [
    { id: 'projects', name: 'المشاريع', enabled: true, color: '#3b82f6' },
    { id: 'units', name: 'الوحدات المتاحة', enabled: true, color: '#10b981' },
    { id: 'sold', name: 'الوحدات المباعة', enabled: false, color: '#ef4444' },
    { id: 'clients', name: 'مواقع العملاء', enabled: false, color: '#f59e0b' },
  ]

  // دوال التحكم في العرض
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleRotateLeft = () => {
    setRotation(prev => prev - 15)
  }

  const handleRotateRight = () => {
    setRotation(prev => prev + 15)
  }

  const handleResetView = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  const handleFullscreen = () => {
    if (!isFullscreen) {
      if (mapContainerRef.current?.requestFullscreen) {
        mapContainerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  // معالجة السحب والإفلات
  const handleMouseDown = (e) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // معالجة التكبير بالعجلة
  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale(prev => Math.min(Math.max(prev * delta, 0.1), 5))
  }

  // معالجة النقر على المناطق
  const handleAreaClick = (area) => {
    setSelectedArea(area)
    toast.success(`تم تحديد ${area.name}`)
  }

  // البحث في المناطق
  const filteredAreas = mapAreas.filter(area =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const container = mapContainerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging])

  // تحقق من وجود ملف الخريطة
  useEffect(() => {
    const checkMapImage = async () => {
      try {
        const response = await fetch('/maps/damietta-new-city.png')
        if (response.ok) {
          setMapImageLoaded(true)
          setMapImageError(false)
        } else {
          setMapImageLoaded(false)
          setMapImageError(true)
        }
      } catch (error) {
        setMapImageLoaded(false)
        setMapImageError(true)
      }
    }
    
    checkMapImage()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-white/20 p-3 rounded-lg">
            <MapPin className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">خريطة دمياط الجديدة</h2>
            <p className="text-blue-100">عارض الخرائط التفاعلي للمشاريع والوحدات العقارية</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <span className="text-sm">إجمالي المشاريع</span>
            </div>
            <div className="text-2xl font-bold mt-1">{mapAreas.reduce((sum, area) => sum + area.projects, 0)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span className="text-sm">إجمالي الوحدات</span>
            </div>
            <div className="text-2xl font-bold mt-1">{mapAreas.reduce((sum, area) => sum + area.units, 0)}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span className="text-sm">المناطق النشطة</span>
            </div>
            <div className="text-2xl font-bold mt-1">{mapAreas.length}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <ZoomIn className="h-5 w-5" />
              <span className="text-sm">مستوى التكبير</span>
            </div>
            <div className="text-2xl font-bold mt-1">{Math.round(scale * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* لوحة التحكم */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* أدوات التحكم */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              أدوات التحكم
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleZoomIn} size="sm" variant="outline">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={handleZoomOut} size="sm" variant="outline">
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={handleRotateLeft} size="sm" variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={handleRotateRight} size="sm" variant="outline">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
              
              <Button onClick={handleResetView} size="sm" variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                إعادة تعيين
              </Button>
              
              <Button onClick={handleFullscreen} size="sm" variant="outline" className="w-full">
                {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                {isFullscreen ? 'خروج' : 'ملء الشاشة'}
              </Button>
            </div>
          </Card>

          {/* البحث */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Search className="h-4 w-4" />
              البحث في المناطق
            </h3>
            
            <Input
              type="text"
              placeholder="ابحث عن منطقة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-3"
            />
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredAreas.map(area => (
                <div
                  key={area.id}
                  onClick={() => handleAreaClick(area)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedArea?.id === area.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{area.name}</div>
                  <div className="text-sm text-gray-600">
                    {area.projects} مشاريع • {area.units} وحدة
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* الطبقات */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              الطبقات
            </h3>
            
            <div className="space-y-3">
              {layers.map(layer => (
                <label key={layer.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={() => {
                      // Update layer state here
                      toast.info(`تم ${layer.enabled ? 'إخفاء' : 'إظهار'} ${layer.name}`)
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="text-sm">{layer.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* منطقة عرض الخريطة */}
        <div className="lg:col-span-3">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">الخريطة التفاعلية</h3>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                تصدير
              </Button>
            </div>
            
            <div 
              ref={mapContainerRef}
              className={`relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 ${
                isFullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-96 lg:h-[600px]'
              }`}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {/* عرض الخريطة أو رسالة الرفع */}
              {mapImageLoaded ? (
                /* الخريطة الفعلية */
                <img
                  ref={mapImageRef}
                  src="/maps/damietta-new-city.png"
                  alt="خريطة دمياط الجديدة"
                  className="absolute inset-0 w-full h-full object-contain"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                  onMouseDown={handleMouseDown}
                  onLoad={() => setMapImageLoaded(true)}
                  onError={() => {
                    setMapImageLoaded(false)
                    setMapImageError(true)
                  }}
                />
              ) : (
                /* رسالة رفع الملف */
                <div
                  className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                  onMouseDown={handleMouseDown}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/95 p-8 rounded-lg shadow-lg text-center max-w-lg">
                      <MapPin className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        خريطة دمياط الجديدة
                      </h3>
                      
                      {mapImageError ? (
                        <div className="text-center">
                          <p className="text-orange-600 mb-4 font-medium">
                            📂 لم يتم العثور على ملف الخريطة
                          </p>
                          <div className="bg-orange-50 p-4 rounded-lg text-right text-sm mb-4">
                            <h4 className="font-semibold text-orange-800 mb-2">خطوات إضافة الخريطة:</h4>
                            <ol className="text-orange-700 space-y-1">
                              <li>1. حول ملف DWG إلى PNG بدقة عالية</li>
                              <li>2. احفظ الملف باسم: <code className="bg-orange-200 px-2 py-1 rounded">damietta-new-city.png</code></li>
                              <li>3. ضع الملف في مجلد: <code className="bg-orange-200 px-2 py-1 rounded">/public/maps/</code></li>
                              <li>4. حدث الصفحة لرؤية الخريطة</li>
                            </ol>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-gray-600 mb-4">
                            العارض جاهز لعرض خريطة DWG التفاعلية
                          </p>
                          <div className="text-sm text-gray-500 mb-4">
                            <p>✓ تكبير وتصغير تفاعلي</p>
                            <p>✓ سحب وإفلات الخريطة</p>
                            <p>✓ دوران الخريطة</p>
                            <p>✓ طبقات المشاريع والوحدات</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                {/* نقاط المشاريع - تظهر فقط مع الخريطة الحقيقية */}
              {mapImageLoaded && mapAreas.map(area => (
                <div
                  key={area.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ 
                    left: `${area.x}%`, 
                    top: `${area.y}%`,
                    transform: `translate(-50%, -50%) scale(${1/scale})`
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAreaClick(area)
                  }}
                >
                  <div className={`relative ${selectedArea?.id === area.id ? 'z-10' : ''}`}>
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                      selectedArea?.id === area.id ? 'bg-blue-600' : 'bg-red-500'
                    }`} />
                    
                    {selectedArea?.id === area.id && (
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-lg border min-w-48">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{area.name}</h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedArea(null)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>🏗️ المشاريع: {area.projects}</p>
                          <p>🏠 الوحدات: {area.units}</p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="text-xs">
                              <Info className="h-3 w-3 mr-1" />
                              تفاصيل
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* مؤشر التحميل */}
              {isDragging && (
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                  السحب والإفلات نشط
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default MapViewer
