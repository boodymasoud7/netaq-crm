import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './button';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center bg-white p-12 rounded-2xl shadow-xl max-w-md border border-gray-200 animate-fadeIn">
        <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <AlertTriangle className="h-12 w-12 text-yellow-600 animate-pulse" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-800 mb-4 animate-slideInUp">404</h1>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 animate-slideInUp">الصفحة غير موجودة</h2>
        <p className="text-gray-600 mb-8 leading-relaxed animate-slideInUp">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها لمكان آخر.
        </p>
        
        <div className="space-y-4 animate-slideInUp">
          <Button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            <Home className="h-5 w-5 ml-2 animate-bounce" />
            العودة للرئيسية
          </Button>
          
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full py-3 transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            <ArrowLeft className="h-5 w-5 ml-2 animate-pulse" />
            العودة للخلف
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-6 animate-fadeIn animate-delay-1000">
          إذا كنت تعتقد أن هذا خطأ، تواصل مع فريق الدعم
        </p>
      </div>
    </div>
  );
}
