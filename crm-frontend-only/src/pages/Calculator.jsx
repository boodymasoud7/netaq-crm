import { useState } from 'react'
import { Calculator as CalcIcon, DollarSign, Percent, Calendar, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { formatCurrency } from '../lib/utils'

export default function Calculator() {
  const [propertyPrice, setPropertyPrice] = useState('')
  const [downPayment, setDownPayment] = useState('')
  const [loanTerm, setLoanTerm] = useState('25')
  const [interestRate, setInterestRate] = useState('4.5')
  const [results, setResults] = useState(null)

  const calculateLoan = () => {
    const price = parseFloat(propertyPrice) || 0
    const down = parseFloat(downPayment) || 0
    const term = parseInt(loanTerm) || 25
    const rate = parseFloat(interestRate) || 4.5

    if (price <= 0) return

    const loanAmount = price - down
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = term * 12

    const monthlyPayment = loanAmount * 
      (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

    const totalPayment = monthlyPayment * numberOfPayments
    const totalInterest = totalPayment - loanAmount

    setResults({
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
      downPaymentPercent: (down / price * 100).toFixed(1)
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">حاسبة التمويل العقاري</h1>
          <p className="text-gray-600 mt-1">احسب أقساط التمويل العقاري والمدفوعات الشهرية</p>
        </div>
      </div>

      <div className="bizmax-grid-2">
        {/* Calculator Form */}
        <Card className="bizmax-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalcIcon className="h-5 w-5 text-primary-600" />
              بيانات التمويل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                سعر العقار (جنيه مصري)
              </label>
              <Input
                type="number"
                placeholder="500000"
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الدفعة المقدمة (جنيه مصري)
              </label>
              <Input
                type="number"
                placeholder="100000"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مدة التمويل (سنة)
              </label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="bizmax-input w-full"
              >
                <option value="15">15 سنة</option>
                <option value="20">20 سنة</option>
                <option value="25">25 سنة</option>
                <option value="30">30 سنة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                معدل الفائدة السنوي (%)
              </label>
              <Input
                type="number"
                step="0.1"
                placeholder="4.5"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>

            <Button 
              onClick={calculateLoan}
              className="w-full bizmax-button-primary"
            >
              احسب القسط الشهري
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bizmax-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              نتائج الحساب
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4">
                <div className="p-4 bg-primary-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-primary-600" />
                    <span className="font-medium text-primary-900">القسط الشهري</span>
                  </div>
                  <p className="text-2xl font-bold text-primary-700">
                    {formatCurrency(results.monthlyPayment)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">مبلغ التمويل</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(results.loanAmount)}
                    </p>
                  </div>
                  <div className="text-center p-3 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">نسبة المقدم</p>
                    <p className="font-semibold text-gray-900">
                      {results.downPaymentPercent}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">إجمالي المدفوعات:</span>
                    <span className="font-medium">{formatCurrency(results.totalPayment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">إجمالي الفوائد:</span>
                    <span className="font-medium text-red-600">{formatCurrency(results.totalInterest)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <CalcIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">أدخل بيانات التمويل واضغط حساب لرؤية النتائج</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card className="bizmax-card">
        <CardHeader>
          <CardTitle>نصائح مهمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">الدفعة المقدمة</h4>
              <p className="text-sm text-blue-700">
                يُنصح بدفع مقدم لا يقل عن 20% من قيمة العقار لتجنب رسوم التأمين الإضافية
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">معدل الفائدة</h4>
              <p className="text-sm text-green-700">
                قارن عروض البنوك المختلفة للحصول على أفضل معدل فائدة ممكن
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-2">مدة التمويل</h4>
              <p className="text-sm text-yellow-700">
                مدة أطول = قسط أقل ولكن فوائد أكثر، مدة أقصر = قسط أعلى وفوائد أقل
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">التكاليف الإضافية</h4>
              <p className="text-sm text-purple-700">
                لا تنس احتساب رسوم التقييم والتأمين وكلف المعاملات القانونية
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
