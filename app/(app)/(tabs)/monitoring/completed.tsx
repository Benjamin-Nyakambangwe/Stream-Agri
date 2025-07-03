import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { powersync } from '@/powersync/system';
import { CheckCircle, MapPin, User, Calendar, FileText } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

interface CompletedSurveyResponse {
    id: string;
    survey_id: number;
    survey_title: string;
    production_cycle_registration_id: number;
    grower_name: string;
    grower_number: string;
    production_cycle_name: string;
    create_date: string;
}

const Completed = () => {
    const { id } = useLocalSearchParams()
    const [completedResponses, setCompletedResponses] = useState<CompletedSurveyResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const getEmployeeId = async () => {
        const employeeId = await SecureStore.getItemAsync('employeeId')
        return employeeId
    }

    const employeeId = getEmployeeId()

    const fetchCompletedSurveys = async () => {
        try {
            console.log('Fetching completed surveys for survey_id:', id)

            const surveyResponses = await powersync.getAll(`
                SELECT 
                    sui.id,
                    sui.survey_id,
                    ss.title as survey_title,
                    sui.production_cycle_registration_id,
                    pcr.grower_name,
                    g.grower_number,
                    pcr.production_cycle_name,
                    sui.create_date
                FROM survey_user_input sui
                LEFT JOIN survey_survey ss ON sui.survey_id = ss.id
                LEFT JOIN odoo_gms_production_cycle_registration pcr ON sui.production_cycle_registration_id = pcr.id
                LEFT JOIN odoo_gms_grower g ON pcr.grower_id = g.id
                WHERE sui.survey_id = ?
                ORDER BY sui.create_date DESC
            `, [id])
            
            console.log('Completed survey responses:', surveyResponses)
            setCompletedResponses(surveyResponses as CompletedSurveyResponse[])
        } catch (error) {
            console.error('Error fetching completed surveys:', error)
            Alert.alert('Error', 'Failed to fetch completed survey responses')
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchCompletedSurveys()
    }, [id])

    const onRefresh = useCallback(() => {
        setRefreshing(true)
        fetchCompletedSurveys()
    }, [id])

    const parseTitle = (title: string | null) => {
        if (!title) return 'Survey Response';
        try {
            const titleObj = JSON.parse(title);
            return titleObj.en_US || titleObj.en_GB || Object.values(titleObj)[0] || 'Survey Response';
        } catch (e) {
            return title || 'Survey Response';
        }
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (e) {
            return dateString
        }
    }

    const viewResponseDetails = (response: CompletedSurveyResponse) => {
        Alert.alert(
            'Response Details',
            `PCR ID: ${response.production_cycle_registration_id}\nGrower: ${response.grower_number || 'Unknown'} - ${response.grower_name || 'Unknown'}\nProduction Cycle: ${response.production_cycle_name || 'Unknown'}\nSubmitted: ${formatDate(response.create_date)}`,
            [{ text: 'OK' }]
        )
    }

    if (loading) {
        return (
            <View className="flex-1 bg-[#65435C] items-center justify-center">
                <Text className="text-white text-lg">Loading completed responses...</Text>
            </View>
        )
    }

    return (
        <>
            <Stack.Screen options={{ 
                title: 'Completed Responses',
                headerTitleStyle: {
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#65435C'
                },
                headerShown: true,
            }} />
            <View className="flex-1 bg-[#65435C]">
                <ScrollView 
                    className="flex-1 p-4"
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {completedResponses.length === 0 ? (
                        <View className="bg-white rounded-2xl p-8 items-center">
                            <FileText size={48} color="#9CA3AF" />
                            <Text className="text-gray-500 text-lg font-semibold mt-4">No Completed Responses</Text>
                            <Text className="text-gray-400 text-center mt-2">
                                Completed survey responses will appear here
                            </Text>
                        </View>
                    ) : (
                        <>
                            <View className="bg-white rounded-2xl p-4 mb-4">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <CheckCircle size={24} color="#10B981" />
                                    <Text className="text-lg font-bold text-[#65435C]">
                                    Survey: {parseTitle(completedResponses[0]?.survey_title)}
                                    </Text>
                                </View>
                                <Text className="text-gray-600">
                                {completedResponses.length} Completed Response{completedResponses.length !== 1 ? 's' : ''}

                                </Text>
                            </View>

                            {completedResponses.map((response, index) => (
                                <TouchableOpacity
                                    key={response.id}
                                    className="bg-white rounded-2xl p-4 mb-4"
                                    onPress={() => viewResponseDetails(response)}
                                >
                                    <View className="flex-row items-center justify-between mb-3">
                                        <View className="flex-row items-center gap-2">
                                            {/* <CheckCircle size={16} color="#10B981" /> */}
                                            <Text className="font-bold text-[#65435C]">
                                                {response.grower_name}
                                            </Text>
                                        </View>
                                        <Text className="text-xs text-gray-500">
                                            {formatDate(response.create_date)}
                                        </Text>
                                    </View>

                                    <View className="space-y-2">
                                        <View className="flex-row items-center gap-2">
                                            <Text className="text-gray-700 flex-1">
                                                {response.grower_number || 'Unknown'} - {response.production_cycle_name || 'Unknown'} - {parseTitle(response.survey_title) || 'Unknown'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View className="mt-3 pt-3 border-t border-gray-200">
                                        <Text className="text-xs text-gray-500 text-center">
                                            Tap for more details
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>
            </View>
        </>
    )
}

export default Completed