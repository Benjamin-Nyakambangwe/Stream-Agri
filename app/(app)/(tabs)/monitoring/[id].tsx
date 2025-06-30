import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Platform } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { powersync, setupPowerSync } from '@/powersync/system';
import { SurveyQuestionRecord } from '@/powersync/Schema';
import { Calendar, Save } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const SurveyResponse = () => {
    const { id } = useLocalSearchParams()
    const [questions, setQuestions] = useState<SurveyQuestionRecord[]>([])
    const [responses, setResponses] = useState<{[key: string]: any}>({})
    const [loading, setLoading] = useState(true)
    const [questionAnswers, setQuestionAnswers] = useState<{[key: string]: any[]}>({}) // Store answers grouped by question_id
    const [showDatePicker, setShowDatePicker] = useState<{[key: string]: boolean}>({}) // Track which date pickers are visible

    useEffect(() => {
        console.log('useEffect SurveyResponse Screen')
        const fetchSurveyData = async () => {
            // Fetch questions
            const questions = await powersync.getAll(`SELECT id, survey_id, question_type, title FROM survey_question WHERE survey_id = ${id}`)
            console.log('questions', questions)
            setQuestions(questions as SurveyQuestionRecord[])
            
            // Fetch question answers for choice-based questions
            const answers = await powersync.getAll(`SELECT id, question_id, value FROM survey_question_answer`)
            console.log('survey_question_answer', answers)
            
            // Group answers by question_id
            const answersGrouped: {[key: string]: any[]} = {}
            answers.forEach((answer: any) => {
                const questionId = answer.question_id?.toString()
                if (questionId) {
                    if (!answersGrouped[questionId]) {
                        answersGrouped[questionId] = []
                    }
                    answersGrouped[questionId].push(answer)
                }
            })
            
            setQuestionAnswers(answersGrouped)
            setLoading(false)
        }
        fetchSurveyData()
    }, [])

    // Parse question title JSON
    const parseTitle = (title: string | null) => {
        if (!title) return 'Untitled Question';
        try {
            const titleObj = JSON.parse(title);
            return titleObj.en_US || titleObj.en_GB || Object.values(titleObj)[0] || 'Untitled Question';
        } catch (e) {
            return title || 'Untitled Question';
        }
    }

    // Parse answer value JSON (same logic as title)
    const parseValue = (value: string | null) => {
        if (!value) return 'Untitled Option';
        try {
            const valueObj = JSON.parse(value);
            return valueObj.en_US || valueObj.en_GB || Object.values(valueObj)[0] || 'Untitled Option';
        } catch (e) {
            return value || 'Untitled Option';
        }
    }

    // Handle response changes
    const handleResponseChange = (questionId: string, value: any) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: value
        }))
    }

    // Format date for display
    const formatDate = (date: Date, includeTime: boolean = false) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }
        
        if (includeTime) {
            options.hour = '2-digit'
            options.minute = '2-digit'
        }
        
        return date.toLocaleDateString('en-US', options)
    }



    // Show date picker
    const showDatePickerModal = (questionId: string) => {
        // For Android, ensure any existing picker is closed first
        if (Platform.OS === 'android') {
            setShowDatePicker(prev => {
                const newState = { ...prev }
                // Close all other pickers
                Object.keys(newState).forEach(key => {
                    newState[key] = false
                })
                return newState
            })
            
            // Small delay to ensure previous picker is fully dismissed
            setTimeout(() => {
                setShowDatePicker(prev => ({
                    ...prev,
                    [questionId]: true
                }))
            }, 100)
        } else {
            setShowDatePicker(prev => ({
                ...prev,
                [questionId]: true
            }))
        }
    }

    // Render different input types based on question_type
    const renderQuestionInput = (question: SurveyQuestionRecord) => {
        const questionId = question.id.toString()
        const currentValue = responses[questionId] || ''
        const questionType = question.question_type || 'text_box'

        switch (questionType) {
            case 'text_box':
            case 'char_box':
                return (
                    <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-base"
                        placeholder="Enter your answer..."
                        value={currentValue}
                        onChangeText={(text) => handleResponseChange(questionId, text)}
                        multiline={questionType === 'text_box'}
                        numberOfLines={questionType === 'text_box' ? 4 : 1}
                    />
                )

            case 'numerical_box':
                return (
                    <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-base"
                        placeholder="Enter a number..."
                        value={currentValue}
                        onChangeText={(text) => handleResponseChange(questionId, text)}
                        keyboardType="numeric"
                    />
                )

            case 'yes_no':
                return (
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            className={`flex-1 p-3 rounded-lg border-2 ${currentValue === 'yes' ? 'bg-green-100 border-green-500' : 'bg-gray-50 border-gray-200'}`}
                            onPress={() => handleResponseChange(questionId, 'yes')}
                        >
                            <Text className={`text-center font-semibold ${currentValue === 'yes' ? 'text-green-700' : 'text-gray-600'}`}>
                                Yes
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 p-3 rounded-lg border-2 ${currentValue === 'no' ? 'bg-red-100 border-red-500' : 'bg-gray-50 border-gray-200'}`}
                            onPress={() => handleResponseChange(questionId, 'no')}
                        >
                            <Text className={`text-center font-semibold ${currentValue === 'no' ? 'text-red-700' : 'text-gray-600'}`}>
                                No
                            </Text>
                        </TouchableOpacity>
                    </View>
                )

            case 'simple_choice':
                const simpleChoices = questionAnswers[questionId] || []
                return (
                    <View className="gap-2">
                        {simpleChoices.map((choice) => {
                            const parsedValue = parseValue(choice.value)
                            return (
                                <TouchableOpacity
                                    key={choice.id}
                                    className={`p-3 rounded-lg border-2 ${currentValue === choice.value ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200'}`}
                                    onPress={() => handleResponseChange(questionId, choice.value)}
                                >
                                    <Text className={`font-semibold ${currentValue === choice.value ? 'text-blue-700' : 'text-gray-600'}`}>
                                        {parsedValue}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                        {simpleChoices.length === 0 && (
                            <Text className="text-gray-500 italic">No options available</Text>
                        )}
                    </View>
                )

            case 'multiple_choice':
                const multipleChoices = questionAnswers[questionId] || []
                const selectedChoices = currentValue || []
                return (
                    <View className="gap-2">
                        {multipleChoices.map((choice) => {
                            const parsedValue = parseValue(choice.value)
                            return (
                                <TouchableOpacity
                                    key={choice.id}
                                    className={`p-3 rounded-lg border-2 ${selectedChoices.includes(choice.value) ? 'bg-purple-100 border-purple-500' : 'bg-gray-50 border-gray-200'}`}
                                    onPress={() => {
                                        const newSelections = selectedChoices.includes(choice.value)
                                            ? selectedChoices.filter((c: string) => c !== choice.value)
                                            : [...selectedChoices, choice.value]
                                        handleResponseChange(questionId, newSelections)
                                    }}
                                >
                                    <Text className={`font-semibold ${selectedChoices.includes(choice.value) ? 'text-purple-700' : 'text-gray-600'}`}>
                                        {parsedValue}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                        {multipleChoices.length === 0 && (
                            <Text className="text-gray-500 italic">No options available</Text>
                        )}
                    </View>
                )

            case 'scale':
                const scaleValues = [1, 2, 3, 4, 5]
                return (
                    <View className="flex-row justify-between gap-2">
                        {scaleValues.map((value) => (
                            <TouchableOpacity
                                key={value}
                                className={`flex-1 p-3 rounded-lg border-2 ${currentValue === value ? 'bg-orange-100 border-orange-500' : 'bg-gray-50 border-gray-200'}`}
                                onPress={() => handleResponseChange(questionId, value)}
                            >
                                <Text className={`text-center font-bold ${currentValue === value ? 'text-orange-700' : 'text-gray-600'}`}>
                                    {value}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )

            case 'date':
            case 'datetime':
                const currentDate = currentValue ? new Date(currentValue) : new Date()
                const displayText = currentValue 
                    ? formatDate(new Date(currentValue), questionType === 'datetime')
                    : `Select ${questionType === 'datetime' ? 'date & time' : 'date'}`
                
                return (
                    <View>
                        <TouchableOpacity
                            className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex-row items-center gap-2"
                            onPress={() => showDatePickerModal(questionId)}
                        >
                            <Calendar size={20} color="#65435C" />
                            <Text className={`text-base ${currentValue ? 'text-gray-800' : 'text-gray-600'}`}>
                                {displayText}
                            </Text>
                        </TouchableOpacity>
                        
                        {showDatePicker[questionId] && Platform.OS === 'ios' && (
                            <DateTimePicker
                                value={currentDate}
                                mode={questionType === 'datetime' ? 'datetime' : 'date'}
                                display="spinner"
                                onChange={(event, selectedDate) => {
                                    // For iOS, we handle this in the Done button
                                }}
                            />
                        )}
                        
                        {showDatePicker[questionId] && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={currentDate}
                                mode={questionType === 'datetime' ? 'datetime' : 'date'}
                                display="default"
                                onChange={(event, selectedDate) => {
                                    // Always hide the picker first for Android
                                    setShowDatePicker(prev => ({ ...prev, [questionId]: false }))
                                    
                                    // Handle the date selection only if user confirmed
                                    if (event.type === 'set' && selectedDate) {
                                        const dateValue = questionType === 'datetime' 
                                            ? selectedDate.toISOString() 
                                            : selectedDate.toISOString().split('T')[0]
                                        handleResponseChange(questionId, dateValue)
                                    }
                                }}
                            />
                        )}
                        
                        {Platform.OS === 'ios' && showDatePicker[questionId] && (
                            <View className="flex-row gap-2 mt-2">
                                <TouchableOpacity
                                    className="flex-1 bg-gray-200 rounded-lg p-2"
                                    onPress={() => setShowDatePicker(prev => ({ ...prev, [questionId]: false }))}
                                >
                                    <Text className="text-center text-gray-700 font-semibold">Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex-1 bg-[#1AD3BB] rounded-lg p-2"
                                    onPress={() => {
                                        const dateValue = questionType === 'datetime' 
                                            ? currentDate.toISOString() 
                                            : currentDate.toISOString().split('T')[0]
                                        handleResponseChange(questionId, dateValue)
                                        setShowDatePicker(prev => ({ ...prev, [questionId]: false }))
                                    }}
                                >
                                    <Text className="text-center text-white font-semibold">Done</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )

            case 'media':
                return (
                    <TouchableOpacity
                        className="bg-gray-50 border border-gray-200 rounded-lg p-6 items-center"
                        onPress={() => Alert.alert('Media Upload', 'Media picker would open here')}
                    >
                        <Text className="text-gray-600">Tap to upload media</Text>
                    </TouchableOpacity>
                )

            default:
                return (
                    <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-base"
                        placeholder="Enter your answer..."
                        value={currentValue}
                        onChangeText={(text) => handleResponseChange(questionId, text)}
                    />
                )
        }
    }

    const handleSubmit = () => {
        console.log('Survey responses:', responses)
        Alert.alert('Success', 'Survey responses saved!', [
            { text: 'OK', onPress: () => router.back() }
        ])
    }

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center">
                <Text className="text-lg text-gray-600">Loading survey...</Text>
            </View>
        )
    }

    return (
        <>
            <Stack.Screen options={{ 
                title: 'Survey Response',
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#65435C'
                },
                headerShown: true,
            }} />
            <View className="flex-1 bg-[#65435C]">
                <ScrollView className="flex-1 p-4">
                    <View className="bg-white rounded-2xl p-4 mb-4">
                        {questions.map((question, index) => (
                            <View key={question.id} className="mb-6">
                                <Text className="text-lg font-bold text-[#65435C] mb-3">
                                    {index + 1}. {parseTitle(question.title)}
                                </Text>
                                <Text className="text-sm text-gray-500 mb-2 capitalize">
                                    {(question.question_type || 'text_box').replace('_', ' ')}
                                </Text>
                                {renderQuestionInput(question)}
                            </View>
                        ))}
                        
                        <TouchableOpacity
                            className="bg-[#1AD3BB] rounded-xl p-4 flex-row items-center justify-center gap-2 mt-4"
                            onPress={handleSubmit}
                        >
                            <Save size={20} color="white" />
                            <Text className="text-white font-bold text-lg">Submit Survey</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </>
    )
}

export default SurveyResponse