import { GeminiResponse } from '@/types/responses.type';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Question {
  question: string;
  options: string[];
  correctOption: number;
}

export default function MainScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Map<number, number>>(new Map());

  const getAIResponse = async () => {
    if (!userPrompt.trim()) {
      Alert.alert("Error", "Please enter a topic for your questions");
      return;
    }

    setIsLoading(true);
    
    const body = {
      "contents": [{
        "parts": [
          { "text": `Generate a list of 5 multiple choice questions about: ${userPrompt}. Each question should have 4 options.` }
        ]
      }],
      "generationConfig": {
        "responseMimeType": "application/json",
        "responseSchema": {
          "type": "ARRAY",
          "items": {
            "type": "OBJECT",
            "properties": {
              "question": { "type": "STRING" },
              "options": {
                "type": "ARRAY",
                "items": { "type": "STRING" }
              },
              "correctOption": { "type": "NUMBER" }
            }
          }
        }
      }
    };

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "",
          },
          body: JSON.stringify(body),
        }
      );

      const data: GeminiResponse = await response.json();
      const parsedQuestions: Question[] = JSON.parse(
        data.candidates[0].content.parts[0].text
      );
      
      setQuestions(parsedQuestions);
      setAnsweredQuestions(new Set());
      setCorrectAnswers(0);
      setSelectedAnswers(new Map());
      
    } catch (error) {
      console.error("Error fetching AI response:", error);
      Alert.alert("Error", "Failed to generate questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    if (answeredQuestions.has(questionIndex)) return;

    const newAnsweredQuestions = new Set(answeredQuestions);
    newAnsweredQuestions.add(questionIndex);
    setAnsweredQuestions(newAnsweredQuestions);

    const newSelectedAnswers = new Map(selectedAnswers);
    newSelectedAnswers.set(questionIndex, optionIndex);
    setSelectedAnswers(newSelectedAnswers);

    if (questions[questionIndex].correctOption === optionIndex) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNewQuestions = () => {
    setQuestions([]);
    setUserPrompt("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Generator</Text>
        {questions.length > 0 && (
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreText}>
              Score: {correctAnswers}/{answeredQuestions.size}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {questions.length === 0 ? (
          <View style={styles.inputContainer}>
            <Text style={styles.instructionText}>
              What kind of questions would you like?
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Cultural aspects of Colombia"
              placeholderTextColor="#999"
              value={userPrompt}
              onChangeText={setUserPrompt}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.generateButton, isLoading && styles.buttonDisabled]}
              onPress={getAIResponse}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#E4EEF0" />
              ) : (
                <Text style={styles.generateButtonText}>Generate Questions</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {questions.map((question, qIndex) => (
              <View key={qIndex} style={styles.questionCard}>
                <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                <Text style={styles.questionText}>{question.question}</Text>
                
                <View style={styles.optionsContainer}>
                  {question.options.map((option, oIndex) => {
                    const isSelected = selectedAnswers.get(qIndex) === oIndex;
                    const isCorrect = question.correctOption === oIndex;
                    const isAnswered = answeredQuestions.has(qIndex);
                    
                    let optionStyle: any[] = [styles.optionButton];
                    if (isAnswered) {
                      if (isSelected && isCorrect) {
                        optionStyle.push(styles.correctOption);
                      } else if (isSelected && !isCorrect) {
                        optionStyle.push(styles.incorrectOption);
                      } else if (isCorrect) {
                        optionStyle.push(styles.correctOption);
                      } else {
                        optionStyle.push(styles.disabledOption);
                      }
                    }

                    return (
                      <TouchableOpacity
                        key={oIndex}
                        style={optionStyle}
                        onPress={() => handleAnswerSelect(qIndex, oIndex)}
                        disabled={isAnswered}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {answeredQuestions.size === questions.length && (
              <View style={styles.completionContainer}>
                <Text style={styles.completionText}>
                  Quiz Complete! 🎉
                </Text>
                <Text style={styles.finalScore}>
                  Final Score: {correctAnswers}/{questions.length}
                </Text>
                <TouchableOpacity
                  style={styles.newQuizButton}
                  onPress={handleNewQuestions}
                >
                  <Text style={styles.newQuizButtonText}>Start New Quiz</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16232A',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#075056',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E4EEF0',
    textAlign: 'center',
    marginBottom: 10,
  },
  scoreContainer: {
    backgroundColor: '#075056',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E4EEF0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  instructionText: {
    fontSize: 20,
    color: '#E4EEF0',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#E4EEF0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#16232A',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#FF5B04',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#E4EEF0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionCard: {
    backgroundColor: '#075056',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  questionNumber: {
    fontSize: 14,
    color: '#FF5B04',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 18,
    color: '#E4EEF0',
    fontWeight: '600',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#16232A',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E4EEF0',
  },
  optionText: {
    fontSize: 16,
    color: '#E4EEF0',
  },
  correctOption: {
    backgroundColor: '#075056',
    borderColor: '#4CAF50',
    borderWidth: 3,
    padding: 15,
    borderRadius: 10,
  },
  incorrectOption: {
    backgroundColor: '#16232A',
    borderColor: '#FF5B04',
    borderWidth: 3,
    padding: 15,
    borderRadius: 10,
  },
  disabledOption: {
    opacity: 0.5,
  },
  completionContainer: {
    backgroundColor: '#075056',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  completionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E4EEF0',
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 20,
    color: '#FF5B04',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  newQuizButton: {
    backgroundColor: '#FF5B04',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  newQuizButtonText: {
    color: '#E4EEF0',
    fontSize: 16,
    fontWeight: 'bold',
  },
});