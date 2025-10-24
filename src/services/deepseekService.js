// DeepSeek AI 服务集成
class DeepSeekService {
  constructor() {
    // 注意：在生产环境中，API密钥应该存储在环境变量中
    this.apiKey = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
    this.baseURL = 'https://api.deepseek.com/v1';
    this.model = 'deepseek-chat';
    
    // 调试信息
    console.log('DeepSeek Service 初始化:');
    console.log('API密钥状态:', this.apiKey ? `已配置 (长度: ${this.apiKey.length})` : '未配置');
    console.log('API基础URL:', this.baseURL);
    
    // 学习状态跟踪
    this.learningState = {
      languageDifficulty: 1, // 1: 基础单字, 2: 词语配对, 3: 简单句子
      mathDifficulty: 1,     // 1: 5以内, 2: 10以内进位, 3: 10以内退位
      correctAnswers: 0,
      totalQuestions: 0,
      recentAnswers: []      // 最近5次答题记录
    };
  }

  // 宠物性格配置
  getPetPersonality(petType) {
    const personalities = {
      fox: {
        name: '小狐狸',
        traits: '聪明活泼、机智灵敏、喜欢探索新知识',
        style: '用活泼可爱的语气回答，经常使用"哇"、"呀"等语气词，喜欢用比喻和生动的例子',
        expertise: '擅长逻辑思维、数学推理和科学探索'
      },
      dolphin: {
        name: '小海豚',
        traits: '友善温柔、善于沟通、富有同理心',
        style: '用温暖友好的语气回答，经常关心用户的感受，喜欢用鼓励性的话语',
        expertise: '擅长语言学习、情感交流和社交技能'
      },
      owl: {
        name: '小猫头鹰',
        traits: '博学睿智、深思熟虑、知识渊博',
        style: '用稳重智慧的语气回答，喜欢分享有趣的知识和历史故事',
        expertise: '擅长文学、历史、哲学和深度思考'
      }
    };
    return personalities[petType] || personalities.fox;
  }
  
  // 从气泡内容生成问题
  async generateQuestionFromBubble(bubbleContent) {
    console.log('从气泡内容生成问题:', bubbleContent);
    
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个小学教育助手，专门引导学生做语文和数学练习题。根据给定的内容，生成一个适合小学生的语文或数学题目，题目要有趣且具有教育意义。'
            },
            {
              role: 'user',
              content: `基于以下内容"${bubbleContent}"，生成一个适合小学生的语文或数学练习题。如果内容与文字、阅读、写作相关，就出语文题；如果与数字、计算、逻辑相关，就出数学题。题目要简洁有趣，不超过50个字：`
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        console.error('生成问题API返回格式错误:', data);
        // 如果API调用失败，返回一个基于气泡内容的默认题目
        return `请根据"${bubbleContent}"这个内容，写一个小故事或者算一道数学题吧！`;
      }
    } catch (error) {
      console.error('生成问题时出错:', error);
      // 如果API调用出错，返回一个基于气泡内容的默认题目
      return `请根据"${bubbleContent}"这个内容，写一个小故事或者算一道数学题吧！`;
    }
  }
  
  // 与宠物聊天
  async chatWithPet(message, petType) {
    console.log('与宠物聊天:', message, petType);
    
    try {
      const personality = this.getPetPersonality(petType);
      const systemPrompt = this.buildSystemPrompt(petType);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 200
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content.trim();
      } else {
        console.error('聊天API返回格式错误:', data);
        // 如果API调用失败，返回一个默认回答
        return `抱歉，我现在有点迷糊了。能再说一遍你的问题吗？`;
      }
    } catch (error) {
      console.error('聊天时出错:', error);
      // 如果API调用出错，返回一个默认回答
      return `抱歉，我现在有点迷糊了。能再说一遍你的问题吗？`;
    }
  }
  
  // 生成宠物主动对话内容
  async generatePetProactiveChatMessage(petType) {
    try {
      const petPersonality = this.getPetPersonality(petType);
      
      // 构建提示词
      const prompt = `作为${petPersonality.name}，${petPersonality.traits}，请生成一句简短的主动对话内容，用于吸引用户注意。${petPersonality.style}`;
      
      // 调用大模型API生成内容
      if (this.apiKey) {
        try {
          const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
              model: this.model,
              messages: [
                {role: "system", content: prompt},
                {role: "user", content: "请生成一句有趣的对话内容"}
              ],
              max_tokens: 100
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
              return data.choices[0].message.content.trim();
            }
          }
          console.log('API调用成功但返回格式不符合预期，使用预设消息');
        } catch (error) {
          console.error('调用API生成对话失败:', error);
          console.log('使用预设消息作为备选');
        }
      }
      
      // 预设的消息，按宠物类型分类
      const petMessages = {
        fox: [
          "嘿嘿，你知道吗？狐狸的尾巴可以帮助它们保持平衡哦！",
          "哇！我刚刚想到一个超有趣的谜题，要不要一起来解一解？",
          "呀！今天天气真好，适合学习新知识呢！有什么想问我的吗？",
          "嘻嘻，我发现了一个有趣的科学小实验，想不想听听看？",
          "哎呀，我刚刚在思考一个数学问题，你能帮我解答吗？"
        ],
        dolphin: [
          "你今天感觉怎么样呀？需要我陪你聊聊天吗？",
          "海洋里有那么多奇妙的事情，想听我分享一些吗？",
          "嗨～我注意到你好像有点安静，一切都好吗？",
          "今天学习顺利吗？如果有困难，我很乐意帮助你哦～",
          "你知道吗？分享快乐可以让快乐加倍，有什么开心的事想告诉我吗？"
        ],
        owl: [
          "你知道吗？猫头鹰的头可以旋转270度，这让我能看到更广阔的世界。",
          "我刚刚在思考一个有趣的历史问题，要不要听听看？",
          "智慧来源于思考和阅读，今天你读了什么有趣的东西吗？",
          "有一句古老的谚语说：'知识就是力量'，你觉得这句话有道理吗？",
          "我喜欢在安静的夜晚思考人生的意义，你有什么深刻的想法想分享吗？"
        ]
      };
      
      // 随机选择一条消息
      const messages = petMessages[petType] || petMessages.fox;
      return messages[Math.floor(Math.random() * messages.length)];
      
    } catch (error) {
      console.error('生成宠物对话失败:', error);
      return "嗨，想聊聊天吗？";  // 返回默认消息
    }
  }

  // 难度调整机制
  adjustDifficulty(subject, isCorrect) {
    this.learningState.totalQuestions++;
    if (isCorrect) {
      this.learningState.correctAnswers++;
    }
    
    // 记录最近5次答题
    this.learningState.recentAnswers.push(isCorrect);
    if (this.learningState.recentAnswers.length > 5) {
      this.learningState.recentAnswers.shift();
    }
    
    // 计算正确率
    const accuracy = this.learningState.correctAnswers / this.learningState.totalQuestions;
    const recentAccuracy = this.learningState.recentAnswers.filter(Boolean).length / this.learningState.recentAnswers.length;
    
    // 根据正确率调整难度
    if (subject === 'language') {
      if (recentAccuracy >= 0.8 && this.learningState.languageDifficulty < 3) {
        this.learningState.languageDifficulty++;
        return '提升难度';
      } else if (recentAccuracy < 0.6 && this.learningState.languageDifficulty > 1) {
        this.learningState.languageDifficulty--;
        return '降低难度';
      }
    } else if (subject === 'math') {
      if (recentAccuracy >= 0.8 && this.learningState.mathDifficulty < 3) {
        this.learningState.mathDifficulty++;
        return '提升难度';
      } else if (recentAccuracy < 0.6 && this.learningState.mathDifficulty > 1) {
        this.learningState.mathDifficulty--;
        return '降低难度';
      }
    }
    
    return '保持难度';
  }

  // 语文识字难度分级
  getLanguageQuestion(difficulty = null) {
    const level = difficulty || this.learningState.languageDifficulty;
    
    const questions = {
      1: { // 基础单字识别
        characters: ['人', '口', '手', '山', '水', '日', '月'],
        template: '这个字读什么？[显示"{{char}}"字]',
        type: 'character_recognition'
      },
      2: { // 词语配对
        words: ['爸爸', '妈妈', '老师', '同学', '朋友', '家人', '学校'],
        template: '这个词怎么读？[显示"{{word}}"词]',
        type: 'word_recognition'
      },
      3: { // 简单句子阅读
        sentences: ['我爱爸爸妈妈', '今天天气很好', '我们一起学习'],
        template: '这句话怎么读？[显示"{{sentence}}"句]',
        type: 'sentence_reading'
      }
    };
    
    return questions[level];
  }

  // 数学十以内加减法难度分级
  getMathQuestion(difficulty = null) {
    const level = difficulty || this.learningState.mathDifficulty;
    
    const questions = {
      1: { // 5以内加减法
        range: [1, 5],
        template: '{{a}}{{op}}{{b}}等于几？',
        type: 'simple_addition_subtraction'
      },
      2: { // 10以内进位加法
        range: [6, 10],
        template: '{{a}}加{{b}}等于几？',
        type: 'carry_addition',
        requiresCarry: true
      },
      3: { // 10以内退位加减法
        range: [1, 10],
        template: '{{a}}{{op}}{{b}}等于几？',
        type: 'borrow_subtraction',
        allowBorrow: true
      }
    };
    
    return questions[level];
  }

  // 离题回答识别
  detectOffTopic(question, answer, subject) {
    const offTopicPatterns = {
      language: {
        // 语文题答非所问
        indicators: ['不知道', '不会', '随便', '算了'],
        shouldContain: ['字', '词', '读', '音']
      },
      math: {
        // 数学题不含数字或计算
        indicators: ['不算了', '太难了', '不想做'],
        shouldContain: /\d+|[零一二三四五六七八九十]/
      }
    };
    
    if (subject === 'language') {
      const hasOffTopicWords = offTopicPatterns.language.indicators.some(word => 
        answer.includes(word)
      );
      return hasOffTopicWords;
    } else if (subject === 'math') {
      const hasNumbers = offTopicPatterns.math.shouldContain.test(answer);
      const hasOffTopicWords = offTopicPatterns.math.indicators.some(word => 
        answer.includes(word)
      );
      return !hasNumbers || hasOffTopicWords;
    }
    
    return false;
  }

  // 分级引导策略
  getGuidanceResponse(level, subject, question) {
    const guidance = {
      1: { // 轻度引导
        language: [
          '这个想法很有趣！不过我们先回答这个问题好吗？',
          '你的回答很有创意！让我们完成这个小练习吧！'
        ],
        math: [
          '我可能需要你的帮助来回答这个问题，我们一起试试好吗？',
          '看起来有点难，让我用更简单的方式问一遍'
        ]
      },
      2: { // 中度引导
        language: [
          '我来示范一下，这个字读作"山"，你来说一遍？',
          '看起来有点难，让我用更简单的方式问一遍'
        ],
        math: [
          '我来示范一下：1,2,3...答案是3，你来算一下'
        ]
      },
      3: { // 重度引导
        language: [
          '我来示范一下，这个字读作"山"，你跟我说一遍',
          '我们一起数：1,2,3...答案是3，你来重复一下'
        ],
        math: [
          '我来示范一下，这个字读作"山"，你跟我说一遍',
          '我们一起数：1,2,3...答案是3，你来重复一下'
        ]
      }
    };
    
    const responses = guidance[level][subject];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // 构建系统提示词
  buildSystemPrompt(petType) {
    const personality = this.getPetPersonality(petType);
    
    return `你是${personality.name}，一个专门为幼儿设计的AI学习伙伴。

性格特点：${personality.traits}
回答风格：${personality.style}
专业领域：${personality.expertise}

学习伙伴功能：
- 你是一个智能学习伙伴，专门帮助学前儿童学习语文识字和数学加减法
- 当前语文难度等级：${this.learningState.languageDifficulty}/3 (1=基础单字，2=词语配对，3=简单句子)
- 当前数学难度等级：${this.learningState.mathDifficulty}/3 (1=5以内加减，2=10以内进位，3=10以内退位)
- 总答题数：${this.learningState.totalQuestions}，正确数：${this.learningState.correctAnswers}

智能引导规则：
1. 根据孩子的回答质量自动调整题目难度
2. 识别离题回答并进行适当引导
3. 使用分级引导策略：轻度→中度→重度
4. 保持鼓励性和耐心，营造积极的学习氛围

重要规则：
1. 你的回答必须适合3-8岁的幼儿理解
2. 使用简单、生动、有趣的语言
3. 多用比喻、故事和游戏化的方式解释概念
4. 保持积极正面的态度，多鼓励和赞美
5. 回答长度控制在50-100字以内
6. 如果遇到不适合幼儿的话题，要巧妙转移到合适的内容
7. 经常询问孩子的想法和感受，保持互动
8. 不要使用使用emoji表情符号

请始终记住你是一个可爱的${personality.name}，要体现出相应的性格特点。`;
  }

  // 智能学习处理
  processLearningInteraction(message, petType) {
    // 检测是否是学习相关的对话
    const isLanguageQuestion = /[字词句读音]/.test(message) || message.includes('语文') || message.includes('识字');
    const isMathQuestion = /[加减等于数字计算]/.test(message) || message.includes('数学') || message.includes('算');
    
    let subject = null;
    let isCorrect = false;
    let guidance = null;
    
    if (isLanguageQuestion) {
      subject = 'language';
      // 简单的正确性判断（实际应用中可以更复杂）
      isCorrect = !this.detectOffTopic(message, message, 'language');
    } else if (isMathQuestion) {
      subject = 'math';
      isCorrect = !this.detectOffTopic(message, message, 'math');
    }
    
    if (subject) {
      // 检测离题回答
      const isOffTopic = this.detectOffTopic('', message, subject);
      
      if (isOffTopic) {
        // 根据离题程度提供引导
        const guidanceLevel = this.learningState.recentAnswers.filter(a => !a).length + 1;
        guidance = this.getGuidanceResponse(Math.min(guidanceLevel, 3), subject, message);
      } else {
        // 调整难度
        const difficultyChange = this.adjustDifficulty(subject, isCorrect);
        if (difficultyChange !== '保持难度') {
          console.log(`学习系统: ${subject} ${difficultyChange}`);
        }
      }
    }
    
    return { subject, isCorrect, guidance, isOffTopic: subject && this.detectOffTopic('', message, subject) };
  }

  // 发送消息到DeepSeek API (流式版本)
  async sendMessageStream(message, petType = 'fox', conversationHistory = [], onChunk = null) {
    console.log('=== sendMessageStream 开始 ===');
    console.log('输入消息:', message);
    console.log('宠物类型:', petType);
    console.log('对话历史长度:', conversationHistory.length);
    
    try {
      // 处理智能学习交互
      const learningResult = this.processLearningInteraction(message, petType);
      
      // 如果检测到离题回答，直接返回引导
      if (learningResult.guidance) {
        console.log('学习系统: 检测到离题回答，提供引导');
        if (onChunk) {
          // 模拟流式输出引导消息
          const guidance = learningResult.guidance;
          for (let i = 0; i < guidance.length; i += 5) {
            const chunk = guidance.slice(i, i + 5);
            onChunk(chunk);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        return learningResult.guidance;
      }

      // 如果没有API密钥，返回模拟回复
      if (!this.apiKey) {
        console.log('警告: 没有API密钥，使用模拟回复');
        const mockResponse = this.getMockResponse(message, petType);
        if (onChunk) {
          // 模拟流式输出
          for (let i = 0; i < mockResponse.length; i += 5) {
            const chunk = mockResponse.slice(i, i + 5);
            onChunk(chunk);
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        return mockResponse;
      }

      console.log('准备调用DeepSeek API...');
      const personality = this.getPetPersonality(petType);
      const systemPrompt = this.buildSystemPrompt(petType);

      // 构建消息历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: message }
      ];

      console.log('发送API请求到:', this.baseURL);
      console.log('使用模型:', this.model);
      console.log('消息数量:', messages.length);

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 200,
          temperature: 0.8,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          stream: true // 启用流式输出
        })
      });

      console.log('API响应状态:', response.status);
      console.log('API响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API请求失败详情:', errorText);
        throw new Error(`API请求失败: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      console.log('开始读取流式响应...');
      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('流式响应读取完成');
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('收到流式响应结束标记');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  const content = parsed.choices[0].delta.content;
                  fullResponse += content;
                  if (onChunk) {
                    onChunk(content);
                  }
                }
              } catch (parseError) {
                // 忽略解析错误，继续处理下一行
                console.log('解析流式数据时出错:', parseError.message);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('DeepSeek API流式调用成功，响应长度:', fullResponse.length);
      return fullResponse.trim();

    } catch (error) {
      console.error('DeepSeek API流式调用失败:', error);
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
      console.log('API密钥状态:', this.apiKey ? '已配置' : '未配置');
      
      // 返回备用回复
      const mockResponse = this.getMockResponse(message, petType);
      console.log('使用备用回复:', mockResponse);
      
      if (onChunk) {
        // 模拟流式输出
        for (let i = 0; i < mockResponse.length; i += 5) {
          const chunk = mockResponse.slice(i, i + 5);
          onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      return mockResponse;
    } finally {
      console.log('=== sendMessageStream 结束 ===');
    }
  }

  // 发送消息到DeepSeek API (原版本，保持兼容性)
  async sendMessage(message, petType = 'fox', conversationHistory = []) {
    try {
      // 处理智能学习交互
      const learningResult = this.processLearningInteraction(message, petType);
      
      // 如果检测到离题回答，直接返回引导
      if (learningResult.guidance) {
        console.log('学习系统: 检测到离题回答，提供引导');
        return learningResult.guidance;
      }

      // 如果没有API密钥，返回模拟回复
      if (!this.apiKey) {
        return this.getMockResponse(message, petType);
      }

      const personality = this.getPetPersonality(petType);
      const systemPrompt = this.buildSystemPrompt(petType);

      // 构建消息历史
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })),
        { role: 'user', content: message }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 200,
          temperature: 0.8,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices.length > 0) {
        console.log('DeepSeek API调用成功');
        return data.choices[0].message.content.trim();
      } else {
        throw new Error('API返回数据格式错误');
      }

    } catch (error) {
      console.log('DeepSeek API调用失败:', error.message);
      console.log('API密钥状态:', this.apiKey ? '已配置' : '未配置');
      // 返回备用回复
      return this.getMockResponse(message, petType);
    }
  }

  // 模拟回复（当API不可用时使用）
  getMockResponse(message, petType) {
    const personality = this.getPetPersonality(petType);
    const responses = {
      fox: [
        '哇！这个问题好有趣呀！🦊 让我想想怎么用最简单的方式告诉你...',
        '小狐狸最喜欢和聪明的小朋友聊天啦！✨ 你的问题让我学到了新东西呢！',
        '嘿嘿，你知道吗？🤔 这就像是一个有趣的谜题，让我们一起来解开它吧！',
        '哇塞！你真是个爱思考的小朋友！🌟 这个问题让小狐狸也要好好想想呢！'
      ],
      dolphin: [
        '小海豚很开心能和你聊天呢！🐬 你的问题让我想到了很多有趣的事情...',
        '哇，你真棒！💙 这个问题问得很好，让我们一起来探索答案吧！',
        '小海豚觉得你很聪明呢！🌊 这样的问题正是我们学习的好机会！',
        '真是个温暖的问题！☀️ 小海豚最喜欢和善良的小朋友交流了！'
      ],
      owl: [
        '小猫头鹰觉得这是个很有深度的问题呢！🦉 让我分享一些有趣的知识...',
        '哇，你问了一个很棒的问题！📚 这让小猫头鹰想起了很多有趣的故事...',
        '真是个爱学习的好孩子！🌙 小猫头鹰最喜欢回答这样的问题了！',
        '这个问题很有意思呢！⭐ 让小猫头鹰告诉你一些神奇的知识吧！'
      ]
    };

    const petResponses = responses[petType] || responses.fox;
    const randomResponse = petResponses[Math.floor(Math.random() * petResponses.length)];
    
    // 根据消息内容添加一些特定回复
    if (message.includes('你好') || message.includes('hi') || message.includes('hello')) {
      return `你好呀！我是${personality.name}！😊 很高兴认识你，我们可以一起学习很多有趣的东西呢！`;
    }
    
    if (message.includes('谢谢') || message.includes('感谢')) {
      return `不用谢啦！${personality.name}最喜欢帮助小朋友了！🥰 还有什么想知道的吗？`;
    }
    
    if (message.includes('再见') || message.includes('拜拜')) {
      return `拜拜！${personality.name}会想念你的！👋 记得常来找我玩哦！`;
    }

    return randomResponse;
  }

  // 获取学习建议
  async getLearningAdvice(topic, petType = 'fox') {
    const personality = this.getPetPersonality(petType);
    const advicePrompts = {
      fox: `作为聪明的小狐狸，给幼儿关于"${topic}"的学习建议，要生动有趣`,
      dolphin: `作为友善的小海豚，给幼儿关于"${topic}"的温暖鼓励和学习方法`,
      owl: `作为博学的小猫头鹰，给幼儿关于"${topic}"的知识分享和学习指导`
    };

    try {
      return await this.sendMessage(advicePrompts[petType] || advicePrompts.fox, petType);
    } catch (error) {
      return `${personality.name}觉得"${topic}"是个很棒的学习主题呢！让我们一起慢慢探索吧！✨`;
    }
  }

  // 生成互动游戏
  async generateGame(petType = 'fox') {
    const personality = this.getPetPersonality(petType);
    const gamePrompts = {
      fox: '设计一个适合幼儿的智力小游戏，要有趣且富有挑战性',
      dolphin: '设计一个适合幼儿的社交互动游戏，要温暖有爱',
      owl: '设计一个适合幼儿的知识问答游戏，要寓教于乐'
    };

    try {
      return await this.sendMessage(gamePrompts[petType] || gamePrompts.fox, petType);
    } catch (error) {
      const games = {
        fox: '让我们玩个数字游戏吧！🦊 我想一个1到10的数字，你来猜猜是几？',
        dolphin: '我们来玩"说说你的感受"游戏吧！🐬 告诉我今天什么事情让你最开心？',
        owl: '让我们玩个知识小问答！🦉 你知道为什么天空是蓝色的吗？'
      };
      return games[petType] || games.fox;
    }
  }

  // 生成语文题目
  generateLanguageQuestion() {
    const questionData = this.getLanguageQuestion();
    const { characters, words, sentences, template, type } = questionData;
    
    let question = '';
    let answer = '';
    
    switch (type) {
      case 'character_recognition': {
        const char = characters[Math.floor(Math.random() * characters.length)];
        question = template.replace('{{char}}', char);
        answer = char;
        break;
      }
      case 'word_recognition': {
        const word = words[Math.floor(Math.random() * words.length)];
        question = template.replace('{{word}}', word);
        answer = word;
        break;
      }
      case 'sentence_reading': {
        const sentence = sentences[Math.floor(Math.random() * sentences.length)];
        question = template.replace('{{sentence}}', sentence);
        answer = sentence;
        break;
      }
    }
    
    return { question, answer, type, difficulty: this.learningState.languageDifficulty };
  }

  // 生成数学题目
  generateMathQuestion() {
    const questionData = this.getMathQuestion();
    const { range, template, type, requiresCarry, allowBorrow } = questionData;
    
    let a, b, op, answer;
    
    switch (type) {
      case 'simple_addition_subtraction':
        a = Math.floor(Math.random() * range[1]) + 1;
        b = Math.floor(Math.random() * range[1]) + 1;
        op = Math.random() > 0.5 ? '+' : '-';
        if (op === '-' && b > a) [a, b] = [b, a]; // 确保结果为正
        answer = op === '+' ? a + b : a - b;
        break;
      case 'carry_addition':
        // 生成需要进位的加法
        a = Math.floor(Math.random() * 5) + 6; // 6-10
        b = Math.floor(Math.random() * (10 - a)) + (10 - a + 1); // 确保和大于10
        op = '+';
        answer = a + b;
        break;
      case 'borrow_subtraction':
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * a) + 1;
        op = Math.random() > 0.5 ? '+' : '-';
        if (op === '-' && allowBorrow) {
          answer = a - b;
        } else {
          answer = a + b;
          op = '+';
        }
        break;
    }
    
    const question = template.replace('{{a}}', a).replace('{{b}}', b).replace('{{op}}', op);
    
    return { question, answer, type, difficulty: this.learningState.mathDifficulty };
  }

  // 获取学习状态
  getLearningState() {
    return {
      ...this.learningState,
      accuracy: this.learningState.totalQuestions > 0 ? 
        (this.learningState.correctAnswers / this.learningState.totalQuestions * 100).toFixed(1) : 0,
      recentAccuracy: this.learningState.recentAnswers.length > 0 ?
        (this.learningState.recentAnswers.filter(Boolean).length / this.learningState.recentAnswers.length * 100).toFixed(1) : 0
    };
  }

  // 重置学习状态
  resetLearningState() {
    this.learningState = {
      languageDifficulty: 1,
      mathDifficulty: 1,
      correctAnswers: 0,
      totalQuestions: 0,
      recentAnswers: []
    };
  }
}

// 创建单例实例
const deepseekService = new DeepSeekService();

export default deepseekService;