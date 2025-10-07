import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { statusConfig } from '../../data/featuresData'
import { cn } from '../../lib/utils'

const FeatureCard = ({ feature, onFeatureClick }) => {
  const IconComponent = feature.icon
  const statusInfo = statusConfig[feature.status]

  return (
    <Card className="bizmax-card hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <CardContent className="p-6">
        <div className="text-center">
          {/* أيقونة كبيرة */}
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:scale-110",
            feature.color
          )}>
            <IconComponent className="h-8 w-8" />
          </div>
          
          {/* العنوان */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {feature.title}
          </h3>
          
          {/* الوصف */}
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {feature.description}
          </p>
          
          {/* حالة الميزة */}
          <div className="flex items-center justify-center mb-4">
            <Badge className={cn(
              "text-xs font-medium border",
              statusInfo.color
            )}>
              <span className="mr-1">{statusInfo.icon}</span>
              {statusInfo.label}
            </Badge>
          </div>
          
          {/* زر التفعيل */}
          <Button 
            className={cn(
              "w-full transition-all duration-300",
              feature.status === 'active' 
                ? "bizmax-button-primary hover:scale-105" 
                : feature.status === 'coming_soon'
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white"
            )}
            onClick={() => onFeatureClick(feature)}
            disabled={feature.status === 'coming_soon'}
          >
            {feature.buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default FeatureCard


