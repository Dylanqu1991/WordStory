

declare const AV: any;
import type { User, ActivationCode, VocabularyLibrary, WordDetails, StorySeries, Story } from '../types';
import { LEANCLOUD_APP_ID, LEANCLOUD_APP_KEY, LEANCLOUD_SERVER_URL } from '../config';
import { fetchMultipleWordDetailsFromApi } from './translationService';

let isSdkInitialized = false;

export const initializeLeanCloud = () => {
  if (isSdkInitialized || !AV) {
    if (!AV) console.error("LeanCloud SDK failed to import correctly.");
    return;
  }
  AV.init({
    appId: LEANCLOUD_APP_ID,
    appKey: LEANCLOUD_APP_KEY,
    serverURL: LEANCLOUD_SERVER_URL
  });
  isSdkInitialized = true;
};

const seedData = [
  {
    library: { title: '初级词汇', description: '适合初学者的基础词汇练习。' },
    series: [
      {
        series: { title: '小动物的故事', description: '通过可爱动物的日常故事学习单词。' },
        stories: [
          {
            title: '小猫的一天',
            content: `Once upon a time, there was a little cat (猫) named Lily. She loved to play (玩) with a small, red ball (球). Every morning, she would wake up and look for her favorite toy. The sun (太阳) was shining brightly in the sky. It was a beautiful (美丽的) day.`
          },
          {
            title: '小狗的朋友',
            content: `Max was a happy (快乐的) dog (狗). He had many friends in the park. One of his best friends was a bird (鸟) who could sing (唱歌) very well. They often sat under a big tree (树) together.`
          }
        ]
      },
      {
        series: { title: '日常对话', description: '模拟日常生活中的简单对话场景。'},
        stories: [
           {
            title: '在商店',
            content: `I want to buy (买) an apple (苹果). The apple is very red (红色的). How much is it? It is not expensive (昂贵的). I will take (拿) it.`
           }
        ]
      }
    ]
  },
  {
    library: { title: '中级词汇', description: '为有一定基础的学习者准备。' },
    series: [
        {
            series: { title: '奇幻旅程', description: '探索充满想象力的奇幻世界。' },
            stories: [
                {
                    title: '魔法森林',
                    content: `In a faraway land, there was a magic (魔法的) forest (森林). An ancient (古老的) river (河流) flowed through it. Many mysterious (神秘的) creatures (生物) lived there. A brave (勇敢的) hero decided to explore (探索) its secrets.`
                }
            ]
        }
    ]
  }
];


export class LeanCloudService {

  constructor() {}

  async verifyConnection(): Promise<void> {
    try {
      const classesToVerify = ['ActivationCode', 'VocabularyLibrary', 'StorySeries', 'Story', 'WordDictionary'];
      for (const className of classesToVerify) {
        const query = new AV.Query(className);
        query.limit(0);
        await query.count();
      }
    } catch (error) {
      console.error("LeanCloud connection check failed:", error);
      const err = error as any;
      const errorMessage = (err.error || err.message || '').toString();
      
      if (errorMessage.includes('Access denied by api domain white list') || errorMessage.includes('request origin')) {
         throw new Error('LeanCloud 安全域名错误: 当前应用网址未被添加到 LeanCloud 后台的安全域名列表中。请检查您的应用设置。');
      }
      
      if (err.code === 101 || errorMessage.includes('Class not found')) {
         const classNameMatch = errorMessage.match(/Class "([^"]+)"/);
         const missingClass = classNameMatch ? classNameMatch[1] : "必需的";
         throw new Error(`LeanCloud 初始化错误: Class "${missingClass}" 未找到。请登录 LeanCloud 控制台手动创建。`);
      }

      if (err.code === 401 || errorMessage.includes('Unauthorized')) {
        throw new Error('LeanCloud 认证失败 (401 Unauthorized): App ID, App Key 或 Server URL 配置不正确。');
      }

      throw new Error(`连接 LeanCloud 失败: ${errorMessage}`);
    }
  }

  // --- Mappers ---
  private mapUser = (avUser: any): User => ({
      phone: avUser.get('phone'),
      email: avUser.get('email'),
      password: '••••••••', 
      role: avUser.get('role'),
      activationCodeUsed: avUser.get('activationCodeUsed'),
  });

  private mapCode = (avCode: any): ActivationCode => ({
      code: avCode.get('code'),
      isUsed: avCode.get('isUsed'),
      usedBy: avCode.get('usedBy') ? avCode.get('usedBy').get('phone') : null,
      usedAt: avCode.get('usedAt') ? avCode.get('usedAt').toISOString() : null,
      createdAt: avCode.createdAt ? avCode.createdAt.toISOString() : new Date().toISOString(),
  });
  
  private mapLibrary = (avLib: any): VocabularyLibrary => ({
      id: avLib.id,
      title: avLib.get('title'),
      description: avLib.get('description'),
      series: [], // Series will be lazy-loaded
  });

  private mapSeries = (avSeries: any): StorySeries => ({
      id: avSeries.id,
      title: avSeries.get('title'),
      description: avSeries.get('description'),
      stories: [], // Stories will be lazy-loaded
  });

  private mapStory = (avStory: any): Story => ({
      id: avStory.id,
      title: avStory.get('title'),
      content: avStory.get('content'),
      status: avStory.get('status'),
      order: avStory.get('order'),
  });

  private isPermissionError = (error: any): boolean => {
    const errorMessage = (error.error || error.message || '').toString();
    return error.code === 119 || error.code === 403 || errorMessage.includes('Permission denied');
  }

  // --- Auth Service ---
  getCurrentUser(): User | null {
      const currentUser = AV.User.current();
      return currentUser ? this.mapUser(currentUser) : null;
  }

  async login(phone: string, password: string): Promise<User> {
    const user = await AV.User.logIn(phone, password);
    return this.mapUser(user);
  }

  async logout(): Promise<void> {
      await AV.User.logOut();
  }
  
  async register(phone: string, password: string, email: string, activationCode: string): Promise<User> {
    const userQuery = new AV.Query('_User');
    userQuery.equalTo('username', phone);
    if (await userQuery.first()) throw new Error('该手机号已被注册。');

    const emailQuery = new AV.Query('_User');
    emailQuery.equalTo('email', email);
    if (await emailQuery.first()) throw new Error('该邮箱已被注册。');
    
    const codeQuery = new AV.Query('ActivationCode');
    codeQuery.equalTo('code', activationCode.toUpperCase());
    codeQuery.equalTo('isUsed', false);
    const codeObject = await codeQuery.first();
    if (!codeObject) throw new Error('无效或已被使用的激活码。');

    const newUser = new AV.User();
    newUser.setUsername(phone);
    newUser.setPassword(password);
    newUser.setEmail(email);
    newUser.set('phone', phone);
    newUser.set('role', 'user');
    newUser.set('activationCodeUsed', codeObject.get('code'));
    
    await newUser.signUp();

    codeObject.set('isUsed', true);
    codeObject.set('usedBy', newUser); 
    codeObject.set('usedAt', new Date());
    await codeObject.save();

    return this.mapUser(newUser);
  }

  async requestPasswordReset(email: string): Promise<void> {
      try {
        await AV.User.requestPasswordReset(email);
      } catch (error) {
        if ((error as any).code === 205) throw new Error("该邮箱未被注册。");
        throw new Error("发送重置邮件失败，请稍后再试。");
      }
  }

  // --- Admin User/Code Management ---
  async getUsers(): Promise<User[]> {
    try {
      const query = new AV.Query('_User');
      query.addDescending('createdAt');
      const avUsers = await query.find();
      return avUsers.map(this.mapUser);
    } catch (error) {
      if (this.isPermissionError(error)) throw new Error('ADMIN_PERMISSION_ERROR: _User');
      throw error;
    }
  }
  
  async getActivationCodes(): Promise<ActivationCode[]> {
    try {
      const query = new AV.Query('ActivationCode');
      query.include('usedBy');
      query.addDescending('createdAt');
      const avCodes = await query.find();
      return avCodes.map(this.mapCode);
    } catch (error) {
       if (this.isPermissionError(error)) throw new Error('ADMIN_PERMISSION_ERROR: ActivationCode');
       throw error;
    }
  }
  
  async generateCodes(count: number): Promise<void> {
    const currentUser = AV.User.current();
    const createCodeObject = () => {
        const code = new AV.Object('ActivationCode');
        code.set('code', Math.random().toString(36).substring(2, 10).toUpperCase());
        code.set('isUsed', false);
        code.set('usedBy', null);
        code.set('usedAt', null);
        const acl = new AV.ACL();
        acl.setPublicReadAccess(true);
        if (currentUser) {
          acl.setWriteAccess(currentUser, true);
        }
        acl.setRoleWriteAccess('admin', true);
        code.setACL(acl);
        return code;
    }
    const newCodeObjects = Array.from({ length: count }, createCodeObject);
    await AV.Object.saveAll(newCodeObjects);
  }
  
  async adminAddUser(phone: string, password: string, email?: string): Promise<void> {
    const adminSessionToken = AV.User.current()?.getSessionToken();
    if (!adminSessionToken) {
        throw new Error("管理员会话丢失，请重新登录后再试。");
    }

    const userQuery = new AV.Query('_User');
    userQuery.equalTo('username', phone);
    const existingUser = await userQuery.first();
    if (existingUser) {
        throw new Error('该手机号已被注册。');
    }
    
    if (email) {
        const emailQuery = new AV.Query('_User');
        emailQuery.equalTo('email', email);
        const existingEmail = await emailQuery.first();
        if (existingEmail) {
            throw new Error('该邮箱已被注册。');
        }
    }

    const newUser = new AV.User();
    newUser.setUsername(phone);
    newUser.setPassword(password);
    newUser.set('phone', phone);
    if(email) newUser.setEmail(email);
    newUser.set('role', 'user');
    newUser.set('activationCodeUsed', 'ADMIN_CREATED');
    
    try {
        await newUser.signUp();
    } catch (error) {
        await AV.User.become(adminSessionToken).catch(e => 
            console.error("Failed to restore admin session after a failed signup:", e)
        );
        throw error;
    }

    await AV.User.become(adminSessionToken);
  }


  async deleteUser(phone: string): Promise<void> {
    alert("出于安全考虑，请在 LeanCloud 控制台中手动删除用户。找到 _User 表并删除对应的行即可。");
    return Promise.resolve();
  }
  
  // --- Content Management (Relational Model) ---

  async getLibraries(): Promise<VocabularyLibrary[]> {
    try {
        const query = new AV.Query('VocabularyLibrary');
        query.addAscending('createdAt');
        const results = await query.find();
        return results.map(this.mapLibrary);
    } catch(error) {
        if (this.isPermissionError(error)) throw new Error('ADMIN_PERMISSION_ERROR: VocabularyLibrary');
        throw error;
    }
  }
  
  async getSeriesForLibrary(libraryId: string): Promise<StorySeries[]> {
    const libraryPointer = AV.Object.createWithoutData('VocabularyLibrary', libraryId);
    const query = new AV.Query('StorySeries');
    query.equalTo('library', libraryPointer);
    query.addAscending('createdAt');
    const results = await query.find();
    return results.map(this.mapSeries);
  }

  async getStoriesForSeries(seriesId: string): Promise<Story[]> {
    const seriesPointer = AV.Object.createWithoutData('StorySeries', seriesId);
    const query = new AV.Query('Story');
    query.equalTo('series', seriesPointer);
    query.addAscending('order');
    const results = await query.find();
    // If order is not set for some, sort them by creation date as a fallback
    return results.sort((a,b) => (a.get('order') ?? Infinity) - (b.get('order') ?? Infinity) || a.createdAt - b.createdAt).map(this.mapStory);
  }
  
  private setAdminACL(object: any): void {
      const acl = new AV.ACL();
      const currentUser = AV.User.current();
      acl.setPublicReadAccess(true);
      if (currentUser) {
        acl.setWriteAccess(currentUser, true);
      }
      acl.setRoleWriteAccess('admin', true);
      object.setACL(acl);
  }

  async addLibrary(title: string, description: string): Promise<VocabularyLibrary> {
      const lib = new AV.Object('VocabularyLibrary');
      lib.set('title', title);
      lib.set('description', description);
      this.setAdminACL(lib);
      const savedLib = await lib.save();
      return this.mapLibrary(savedLib);
  }

  async addSeries(libraryId: string, title: string, description: string): Promise<StorySeries> {
      const series = new AV.Object('StorySeries');
      series.set('title', title);
      series.set('description', description);
      series.set('library', AV.Object.createWithoutData('VocabularyLibrary', libraryId));
      this.setAdminACL(series);
      const savedSeries = await series.save();
      return this.mapSeries(savedSeries);
  }
  
  async addStory(seriesId: string, title: string, content: string, status: Story['status'], order: number): Promise<Story> {
      const story = new AV.Object('Story');
      story.set('title', title);
      story.set('content', content);
      story.set('status', status);
      story.set('order', order);
      story.set('series', AV.Object.createWithoutData('StorySeries', seriesId));
      this.setAdminACL(story);
      const savedStory = await story.save();
      return this.mapStory(savedStory);
  }
  
  async updateLibrary(id: string, title: string, description: string): Promise<void> {
      const lib = AV.Object.createWithoutData('VocabularyLibrary', id);
      lib.set('title', title);
      lib.set('description', description);
      await lib.save();
  }
  
  async updateSeries(id: string, title: string, description: string): Promise<void> {
      const series = AV.Object.createWithoutData('StorySeries', id);
      series.set('title', title);
      series.set('description', description);
      await series.save();
  }

  async updateStory(id: string, data: Partial<Story>): Promise<void> {
      const story = AV.Object.createWithoutData('Story', id);
      if (data.title) story.set('title', data.title);
      if (data.content) story.set('content', data.content);
      if (data.status) story.set('status', data.status);
      await story.save();
  }
  
  async deleteStory(id: string): Promise<void> {
    try {
      const story = AV.Object.createWithoutData('Story', id);
      await story.destroy();
    } catch (error) {
      if (this.isPermissionError(error)) {
        throw new Error(
          '删除失败：权限不足。\n\n' +
          '这通常意味着您不是这个故事的创建者，或者您的 "admin" 角色缺少 Class 权限。\n\n' +
          '请按以下步骤在 LeanCloud 控制台修复：\n' +
          '1. **确认角色关联**：进入 **存储 → 数据 → `_Role` 表**，确认您的用户在 `admin` 角色的 `users` 关联列表中。\n' +
          '2. **设置 Class 权限 (关键步骤)**：进入 **存储 → 数据 → `Story` 表**，点击 **"权限"** 标签页。找到 **`delete`** 操作，将其权限修改为 **"指定角色"**，然后在列表中勾选 **`admin`** 角色并保存。\n\n' +
          '完成这些设置后，所有管理员将能删除任何故事。'
        );
      }
      throw error;
    }
  }

  async reorderStories(stories: {id: string, order: number}[]): Promise<void> {
      const avObjects = stories.map(({id, order}) => {
          const story = AV.Object.createWithoutData('Story', id);
          story.set('order', order);
          return story;
      });
      await AV.Object.saveAll(avObjects);
  }

  // --- Dictionary Management ---
  async getDictionary(): Promise<Record<string, WordDetails>> {
    const query = new AV.Query('WordDictionary');
    query.limit(1000);
    try {
        const results = await query.find();
        const dictionary: Record<string, WordDetails> = {};
        results.forEach(item => {
            const details = item.get('details');
            const word = item.get('word');
            if (word && details) {
                dictionary[word] = details;
            } else {
                console.warn('Skipping malformed dictionary entry from LeanCloud:', { word, details: !!details });
            }
        });
        return dictionary;
    } catch(error) {
        if (this.isPermissionError(error)) {
            throw new Error('ADMIN_PERMISSION_ERROR: WordDictionary');
        }
        throw error;
    }
  }

  async saveWordDetails(details: Record<string, WordDetails>): Promise<void> {
    const words = Object.keys(details);
    if (words.length === 0) return;

    const query = new AV.Query('WordDictionary');
    query.containedIn('word', words);
    const existingEntries = await query.find();

    const existingMap = new Map<string, any>();
    existingEntries.forEach(entry => {
      existingMap.set(entry.get('word'), entry);
    });

    const objectsToSave = words.map(word => {
      const entry = existingMap.get(word) || new AV.Object('WordDictionary');
      entry.set('word', word);
      entry.set('details', details[word]);
      
      if (!entry.getACL()) {
          const acl = new AV.ACL();
          acl.setPublicReadAccess(true);
          acl.setRoleWriteAccess('admin', true);
          entry.setACL(acl);
      }
      return entry;
    });

    await AV.Object.saveAll(objectsToSave);
  }

  async getSoundUrls(): Promise<{ correct: string; wrong: string; }> {
    // The previous implementation attempted to fetch and cache the sound files as blobs
    // to improve performance and enable offline use. However, this failed with a "Failed to fetch"
    // error, most likely due to Cross-Origin Resource Sharing (CORS) restrictions on the server
    // hosting the audio files. The server does not seem to allow cross-origin requests from the browser.
    //
    // To fix this error, the caching logic has been removed. We now return the remote URLs directly.
    // The browser's own HTTP caching will still provide some performance benefits on repeated visits,
    // assuming the server sends appropriate cache headers. This change resolves the console error.
    return Promise.resolve({
        correct: 'http://wj.zhuanxingbiji.com/OVExHCPDpLaDFUGQMGTHLu839z7qbIH7/correct.MP3',
        wrong: 'http://wj.zhuanxingbiji.com/JTiiYEQzAPL2yp3Pq3wKHjzeU5eu7Inu/wrong.MP3',
    });
  }

  async ensureAdminRole(): Promise<void> {
    const currentUser = AV.User.current();
    if (!currentUser || currentUser.get('role') !== 'admin') return;

    try {
        const roleQuery = new AV.Query(AV.Role);
        roleQuery.equalTo('name', 'admin');
        let adminRole = await roleQuery.first();

        if (!adminRole) {
            const roleACL = new AV.ACL();
            roleACL.setPublicReadAccess(true);
            roleACL.setPublicWriteAccess(false);
            adminRole = new AV.Role('admin', roleACL);
            await adminRole.save();
        }

        const usersRelation = adminRole.getUsers();
        const userQuery = usersRelation.query();
        userQuery.equalTo('objectId', currentUser.id);
        const userInRole = await userQuery.first();

        if (!userInRole) {
            usersRelation.add(currentUser);
            await adminRole.save();
        }
    } catch (error) {
        console.error("Error ensuring admin role:", error);
        throw new Error("无法自动配置管理员角色。请检查 LeanCloud 控制台中的 _Role 表权限设置。");
    }
  }

  async seedInitialData(): Promise<boolean> {
    const query = new AV.Query('VocabularyLibrary');
    const count = await query.count();
    if (count > 0) {
      return false;
    }

    try {
      for (const libData of seedData) {
        const newLibrary = await this.addLibrary(libData.library.title, libData.library.description);
        
        for (const seriesData of libData.series) {
          const newSeries = await this.addSeries(newLibrary.id, seriesData.series.title, seriesData.series.description);
          
          let order = 0;
          for (const storyData of seriesData.stories) {
            const newStory = await this.addStory(newSeries.id, storyData.title, storyData.content, 'caching', order++);
            
            const wordRegex = /\b([a-zA-Z']+)\s*\([^)]+\)/g;
            const matches = newStory.content.matchAll(wordRegex);
            const uniqueWords = [...new Set(Array.from(matches, match => match[1].toLowerCase()))];

            if (uniqueWords.length > 0) {
              const fetchedDetails = await fetchMultipleWordDetailsFromApi(uniqueWords);
              await this.saveWordDetails(fetchedDetails);
            }
            
            await this.updateStory(newStory.id, { status: 'published' });
          }
        }
      }
      return true;
    } catch (error) {
        console.error("Failed to seed initial data:", error);
        return false;
    }
  }
}