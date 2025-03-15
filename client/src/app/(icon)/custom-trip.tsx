import { View, Text, TextInput, ScrollView, Button } from 'react-native'
import React, { useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { TouchableOpacity } from 'react-native-gesture-handler'

export default function CustomTrip() {
  const [tripDetails, setTripDetails] = useState({
    destination: '',
    startDate: new Date(),
    endDate: new Date(),
    numberOfPeople: '1',
    budget: '',
    tripType: 'solo',
    notes: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = (name: string, value: string | Date) => {
    switch (name) {
      case 'destination':
        if (!value) return 'Destination is required'
        if (value.toString().length < 3) return 'Destination too short'
        break
      case 'startDate':
      case 'endDate':
        if (!value) return `${name === 'startDate' ? 'Start' : 'End'} date is required`
        if (new Date(tripDetails.endDate) < new Date(tripDetails.startDate)) 
          return 'End date cannot be before start date'
        break
      case 'budget':
        if (value && isNaN(Number(value))) return 'Budget must be a number'
        break
    }
    return ''
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const newErrors: Record<string, string> = {}
    
    // Validate all fields
    Object.entries(tripDetails).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) newErrors[key] = error
    })
    
    // Date comparison validation
    if (new Date(tripDetails.endDate) < new Date(tripDetails.startDate)) {
      newErrors.endDate = 'End date cannot be before start date'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('Trip Details:', tripDetails)
        // Add navigation or success message here
      } catch (error) {
        setErrors({ form: 'Submission failed. Please try again.' })
      }
    }
    
    setIsSubmitting(false)
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(null)
    if (selectedDate) {
      setTripDetails(prev => ({
        ...prev,
        [showDatePicker === 'start' ? 'startDate' : 'endDate']: selectedDate
      }))
    }
  }

  return (
    <ScrollView className="p-4 bg-gray-50">
      <Text className="text-2xl font-bold mb-6 text-blue-800">Plan Your Perfect Trip</Text>
      
      {/* Destination */}
      <View className="mb-5">
        <Text className="mb-2 font-medium text-gray-700">Destination *</Text>
        <TextInput
          className={`bg-white p-4 rounded-lg border ${
            errors.destination ? 'border-red-500' : 'border-gray-200'
          }`}
          placeholder="Where are you going?"
          value={tripDetails.destination}
          onChangeText={text => {
            setTripDetails({...tripDetails, destination: text})
            if (errors.destination) setErrors(prev => ({...prev, destination: ''}))
          }}
          maxLength={100}
        />
        {errors.destination && (
          <Text className="text-red-500 mt-1 text-sm">{errors.destination}</Text>
        )}
      </View>

      {/* Dates */}
      <View className="flex-row justify-between mb-5">
        <View className="w-[48%]">
          <Text className="mb-2 font-medium text-gray-700">Start Date *</Text>
          <TouchableOpacity 
            onPress={() => setShowDatePicker('start')}
            className={`bg-white p-4 rounded-lg border ${
              errors.startDate ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <Text className="text-gray-600">
              {tripDetails.startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className="w-[48%]">
          <Text className="mb-2 font-medium text-gray-700">End Date *</Text>
          <TouchableOpacity 
            onPress={() => setShowDatePicker('end')}
            className={`bg-white p-4 rounded-lg border ${
              errors.endDate ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <Text className="text-gray-600">
              {tripDetails.endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>
        
        {showDatePicker && (
          <DateTimePicker
            value={tripDetails[showDatePicker]}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </View>

      {/* People & Budget */}
      <View className="flex-row justify-between mb-5">
        <View className="w-[48%]">
          <Text className="mb-2 font-medium text-gray-700">Travelers</Text>
          <View className="bg-white rounded-lg border border-gray-200">
            <Picker
              selectedValue={tripDetails.numberOfPeople}
              onValueChange={value => setTripDetails({...tripDetails, numberOfPeople: value})}
              dropdownIconColor="#3b82f6"
            >
              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                <Picker.Item 
                  key={num} 
                  label={`${num} ${num === 1 ? 'person' : 'people'}`} 
                  value={`${num}`} 
                />
              ))}
            </Picker>
          </View>
        </View>

        <View className="w-[48%]">
          <Text className="mb-2 font-medium text-gray-700">Budget</Text>
          <View className={`bg-white p-4 rounded-lg border ${
            errors.budget ? 'border-red-500' : 'border-gray-200'
          }`}>
            <TextInput
              className="text-gray-600"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={tripDetails.budget}
              onChangeText={text => {
                setTripDetails({...tripDetails, budget: text})
                if (errors.budget) setErrors(prev => ({...prev, budget: ''}))
              }}
            />
          </View>
          {errors.budget && (
            <Text className="text-red-500 mt-1 text-sm">{errors.budget}</Text>
          )}
        </View>
      </View>

      {/* Trip Type */}
      <View className="mb-4">
        <Text className="mb-2 font-medium">Trip Type</Text>
        <Picker
          selectedValue={tripDetails.tripType}
          onValueChange={value => setTripDetails({...tripDetails, tripType: value})}
          className="bg-white rounded-lg">
          <Picker.Item label="Solo" value="solo" />
          <Picker.Item label="Couple" value="couple" />
          <Picker.Item label="Family" value="family" />
          <Picker.Item label="Friends" value="friends" />
          <Picker.Item label="Business" value="business" />
        </Picker>
      </View>

      {/* Additional Notes */}
      <View className="mb-6">
        <Text className="mb-2 font-medium">Additional Notes</Text>
        <TextInput
          className="bg-white p-3 rounded-lg h-24"
          placeholder="Special requirements, preferences..."
          multiline
          value={tripDetails.notes}
          onChangeText={text => setTripDetails({...tripDetails, notes: text})}
        />
      </View>

      {/* Error Messages */}
      {errors.form && (
        <View className="mb-4 p-3 bg-red-100 rounded-lg">
          <Text className="text-red-600 text-center">{errors.form}</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={isSubmitting}
        className={`p-4 rounded-lg ${isSubmitting ? 'bg-blue-300' : 'bg-blue-600'}`}
      >
        <Text className="text-white text-center font-semibold">
          {isSubmitting ? 'Creating Plan...' : 'Create My Trip Plan'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}