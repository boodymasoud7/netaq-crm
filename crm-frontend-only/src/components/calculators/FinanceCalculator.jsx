import { useState, useEffect } from 'react'
import { Calculator, DollarSign, Percent, Calendar, TrendingUp, FileText, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'
import toast from 'react-hot-toast'

// دالة تنسيق العملة المصرية
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('ج.م.', '') + ' جنيه'
}

const FinanceCalculator = ({ isOpen, onClose }) => {
  const [propertyPrice, setPropertyPrice] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [loanDuration, setLoanDuration] = useState('25')
  const [interestRate, setInterestRate] = useState('18.5')
  const [bankName, setBankName] = useState('الأهلي المصري')
  const [results, setResults] = useState(null)

  // البنوك المصرية المتاحة مع أسعار الفائدة
  const banks = [
    { name: 'الأهلي المصري', rate: 18.5, minRate: 17.5, maxRate: 20.0 },
    { name: 'بنك مصر', rate: 18.0, minRate: 17.0, maxRate: 19.5 },
    { name: 'البنك التجاري الدولي CIB', rate: 19.0, minRate: 18.0, maxRate: 20.5 },
    { name: 'بنك القاهرة', rate: 18.25, minRate: 17.25, maxRate: 19.75 },
    { name: 'البنك العربي الأفريقي', rate: 19.5, minRate: 18.5, maxRate: 21.0 },
    { name: 'بنك الإسكندرية', rate: 18.75, minRate: 17.75, maxRate: 20.25 },
    { name: 'QNB الأهلي', rate: 19.25, minRate: 18.25, maxRate: 20.75 }
  ]

  // حساب القسط الشهري
  const calculateMonthlyPayment = (principal, rate, years) => {
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12
    
    if (monthlyRate === 0) {
      return principal / numberOfPayments
    }
    
    const monthlyPayment = principal * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    
    return monthlyPayment
  }

  // حساب جدول السداد
  const calculateAmortization = (principal, rate, years) => {
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12
    const monthlyPayment = calculateMonthlyPayment(principal, rate, years)
    
    let balance = principal
    const schedule = []
    
    for (let month = 1; month <= numberOfPayments; month++) {
      const interestPayment = balance * monthlyRate
      const principalPayment = monthlyPayment - interestPayment
      balance -= principalPayment
      
      schedule.push({
        month,
        monthlyPayment,
        principalPayment,
        interestPayment,
        remainingBalance: Math.max(balance, 0)
      })
      
      if (balance <= 0) break
    }
    
    return schedule
  }

  // معالج الحساب
  const handleCalculate = () => {
    if (!propertyPrice || !downPayment) {
      toast.error('يرجى إدخال جميع البيانات المطلوبة')
      return
    }

    const price = parseFloat(propertyPrice)
    const down = parseFloat(downPayment)
    const rate = parseFloat(interestRate)
    const years = parseInt(loanDuration)

    if (down >= price) {
      toast.error('قيمة المقدم لا يمكن أن تكون أكبر من أو تساوي سعر العقار')
      return
    }

    const loanAmount = price - down
    const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, years)
    const totalPayments = monthlyPayment * years * 12
    const totalInterest = totalPayments - loanAmount
    const downPaymentPercentage = (down / price) * 100
    
    // حساب جدول السداد
    const amortizationSchedule = calculateAmortization(loanAmount, rate, years)
    
    setResults({
      propertyPrice: price,
      downPayment: down,
      loanAmount,
      monthlyPayment,
      totalPayments,
      totalInterest,
      downPaymentPercentage,
      interestRate: rate,
      loanDuration: years,
      bankName,
      amortizationSchedule,
      calculatedAt: new Date()
    })

    toast.success('تم حساب التمويل بنجاح!')
  }

  // تحديث سعر الفائدة عند تغيير البنك
  useEffect(() => {
    const selectedBank = banks.find(bank => bank.name === bankName)
    if (selectedBank) {
      setInterestRate(selectedBank.rate.toString())
    }
  }, [bankName])

  // تصدير النتائج كـ PDF (محاكاة)
  const exportToPDF = () => {
    toast.success('سيتم إضافة تصدير PDF قريباً')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">حاسبة الأقساط العقارية</h2>
                <p className="text-gray-600">احسب الأقساط الشهرية والفوائد بدقة</p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              إغلاق
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* نموذج الإدخال */}
            <div className="space-y-6">
              <Card className="bizmax-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    بيانات العقار والقرض
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* سعر العقار */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سعر العقار (جنيه مصري)
                    </label>
                    <Input
                      type="number"
                      placeholder="مثال: 2000000"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(e.target.value)}
                      className="text-right"
                    />
                  </div>

                  {/* المقدم */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المقدم (جنيه مصري)
                    </label>
                    <Input
                      type="number"
                      placeholder="مثال: 400000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="text-right"
                    />
                    {propertyPrice && downPayment && (
                      <p className="text-xs text-gray-500 mt-1">
                        نسبة المقدم: {((parseFloat(downPayment) / parseFloat(propertyPrice)) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>

                  {/* اختيار البنك */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البنك
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {banks.map(bank => (
                        <option key={bank.name} value={bank.name}>
                          {bank.name} - {bank.rate}%
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* سعر الفائدة */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      سعر الفائدة السنوي (%)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="text-right"
                    />
                  </div>

                  {/* مدة القرض */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      مدة القرض (سنة)
                    </label>
                    <select
                      value={loanDuration}
                      onChange={(e) => setLoanDuration(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="15">15 سنة</option>
                      <option value="20">20 سنة</option>
                      <option value="25">25 سنة</option>
                      <option value="30">30 سنة</option>
                    </select>
                  </div>

                  <Button 
                    onClick={handleCalculate}
                    className="w-full bizmax-button-primary"
                  >
                    <Calculator className="h-4 w-4 ml-2" />
                    احسب الأقساط
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* النتائج */}
            <div className="space-y-6">
              {results ? (
                <>
                  {/* ملخص النتائج */}
                  <Card className="bizmax-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        ملخص الأقساط
                        <Badge className="bg-green-100 text-green-800 mr-auto">
                          {results.bankName}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatCurrency(results.monthlyPayment)}
                          </div>
                          <div className="text-sm text-gray-600">القسط الشهري</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(results.loanAmount)}
                          </div>
                          <div className="text-sm text-gray-600">مبلغ القرض</div>
                        </div>
                        
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(results.totalInterest)}
                          </div>
                          <div className="text-sm text-gray-600">إجمالي الفوائد</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(results.totalPayments)}
                          </div>
                          <div className="text-sm text-gray-600">إجمالي المدفوعات</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>سعر العقار:</span>
                          <span className="font-medium">{formatCurrency(results.propertyPrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>المقدم ({results.downPaymentPercentage.toFixed(1)}%):</span>
                          <span className="font-medium">{formatCurrency(results.downPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>سعر الفائدة:</span>
                          <span className="font-medium">{results.interestRate}% سنوياً</span>
                        </div>
                        <div className="flex justify-between">
                          <span>مدة القرض:</span>
                          <span className="font-medium">{results.loanDuration} سنة</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* مقارنة البنوك */}
                  <Card className="bizmax-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Percent className="h-5 w-5" />
                        مقارنة البنوك
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {banks.map(bank => {
                          const monthlyPayment = calculateMonthlyPayment(
                            results.loanAmount, 
                            bank.rate, 
                            results.loanDuration
                          )
                          const isSelected = bank.name === results.bankName
                          
                          return (
                            <div 
                              key={bank.name}
                              className={`p-3 rounded-lg border ${
                                isSelected 
                                  ? 'border-green-500 bg-green-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{bank.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {bank.rate}% - {bank.minRate}% إلى {bank.maxRate}%
                                  </div>
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-lg">
                                    {formatCurrency(monthlyPayment)}
                                  </div>
                                  <div className="text-sm text-gray-600">شهرياً</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* أزرار التصدير */}
                  <div className="flex gap-3">
                    <Button 
                      onClick={exportToPDF}
                      className="flex-1 bizmax-button-primary"
                    >
                      <Download className="h-4 w-4 ml-2" />
                      تصدير PDF
                    </Button>
                    <Button 
                      onClick={() => toast.success('تم نسخ الرابط للمشاركة')}
                      variant="outline"
                      className="flex-1"
                    >
                      <FileText className="h-4 w-4 ml-2" />
                      مشاركة
                    </Button>
                  </div>
                </>
              ) : (
                <Card className="bizmax-card">
                  <CardContent className="text-center py-12">
                    <Calculator className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      احسب الأقساط
                    </h3>
                    <p className="text-gray-600">
                      أدخل بيانات العقار والقرض لحساب الأقساط الشهرية
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinanceCalculator
