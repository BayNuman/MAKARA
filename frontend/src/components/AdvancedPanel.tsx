import React, { useState, useEffect } from 'react';
import { Video, Volume2, Settings2, Save, FileText } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getTranslation } from '../i18n/translations';

export const AdvancedPanel: React.FC = () => {
  const {
    preferences,
    updatePreferences,
    presets,
    fetchPresets,
    savePreset
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'subtitles' | 'general'>('video');
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [installedBrowsers, setInstalledBrowsers] = useState<Array<{ id: string; name: string; installed: boolean }>>([]);

  useEffect(() => {
    fetchPresets();
    import('../api/client').then(({ apiClient }) => {
      apiClient.get('/config/browsers').then((res) => {
        if (Array.isArray(res.data)) {
          setInstalledBrowsers(res.data);
        }
      }).catch((err) => console.warn('Failed to fetch installed browsers:', err));
    });
  }, [fetchPresets]);

  if (!preferences) return null;

  const currentLang = preferences.current_lang || 'en';

  const handleToggle = async (key: keyof typeof preferences) => {
    await updatePreferences({ [key]: !preferences[key] });
  };

  const handleValueChange = async (key: keyof typeof preferences, value: any) => {
    await updatePreferences({ [key]: value });
  };

  const handleCustomValueChange = async (key: string, value: any) => {
    const custom = { ...(preferences.custom_settings || {}), [key]: value };
    await updatePreferences({ custom_settings: custom });
  };

  const handleLoadPreset = async (presetName: string) => {
    const selected = presets[presetName];
    if (selected) {
      const custom = {
        ...(preferences.custom_settings || {}),
        video_container: selected.video_format || preferences.custom_settings?.video_container || 'mp4',
        audio_format: selected.audio_format || preferences.custom_settings?.audio_format || 'mp3',
        audio_quality_preset: selected.audio_quality || preferences.custom_settings?.audio_quality_preset || 'Best'
      };

      const patch: any = {
        custom_settings: custom
      };
      if (selected.mode !== undefined) patch.mode = selected.mode;
      if (selected.video_profile !== undefined) patch.active_profile = selected.video_profile;
      if (selected.metadata_flag !== undefined) patch.metadata_flag = selected.metadata_flag;
      if (selected.thumbnail_flag !== undefined) patch.thumbnail_flag = selected.thumbnail_flag;
      if (selected.restrict_filenames !== undefined) patch.restrict_filenames = selected.restrict_filenames;
      if (selected.concurrent_fragments !== undefined) patch.concurrent_fragments = selected.concurrent_fragments;
      
      await updatePreferences(patch);
    }
  };

  const handleSaveCurrentAsPreset = async () => {
    const trimmed = newPresetName.trim();
    if (!trimmed) return;
    
    const settings = {
      mode: preferences.active_profile === 'Audio' ? 'Audio' : 'Video',
      video_profile: preferences.active_profile,
      video_format: preferences.custom_settings?.video_container || 'mp4',
      audio_format: preferences.custom_settings?.audio_format || 'mp3',
      audio_quality: preferences.custom_settings?.audio_quality_preset || 'Best',
      metadata_flag: preferences.metadata_flag,
      thumbnail_flag: preferences.thumbnail_flag,
      restrict_filenames: preferences.restrict_filenames,
      concurrent_fragments: preferences.concurrent_fragments
    };

    await savePreset(trimmed, settings);
    setNewPresetName('');
    setShowSaveModal(false);
  };

  return (
    <div className="w-full border-b border-[var(--hairline)] p-6 transition-all duration-300">
      <div className="flex flex-col gap-6">
        
        {/* Header with Preset Options */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-2">
            <span className="panel-idx">03</span>
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--ink)] font-mono">
              {getTranslation(currentLang, 'sec_advanced_config')}
            </h2>
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => e.target.value && handleLoadPreset(e.target.value)}
              defaultValue=""
              className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3 py-1.5 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
            >
              <option value="" disabled className="bg-[var(--bg-elevated)]">
                {getTranslation(currentLang, 'lbl_load_preset')}
              </option>
              {Object.keys(presets).map((name) => (
                <option key={name} value={name} className="bg-[var(--bg-elevated)]">
                  {name}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-deep)] transition-all font-mono"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{getTranslation(currentLang, 'btn_save')}</span>
            </button>
          </div>
        </div>

        {/* Save Preset Dialog modal */}
        {showSaveModal && (
          <div className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] p-4 flex flex-col gap-3 animate-slide-in">
            <span className="text-xs font-semibold text-[var(--ink)] font-mono">
              {getTranslation(currentLang, 'lbl_save_preset')}
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder={getTranslation(currentLang, 'lbl_preset_name_placeholder')}
                className="w-full rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs outline-none text-[var(--ink)] font-mono"
              />
              <button
                onClick={handleSaveCurrentAsPreset}
                disabled={!newPresetName.trim()}
                className="rounded-[var(--radius)] bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-[var(--accent-ink)] hover:bg-[var(--accent-deep)] disabled:opacity-50 font-mono"
              >
                {getTranslation(currentLang, 'btn_ok')}
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-mono"
              >
                {getTranslation(currentLang, 'btn_cancel_text')}
              </button>
            </div>
          </div>
        )}

        {/* Tabs navigation */}
        <div className="flex border-b border-[var(--hairline)] flex-wrap">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all font-mono uppercase tracking-wider ${
              activeTab === 'video'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]'
            }`}
          >
            <Video className="h-3.5 w-3.5" />
            <span>{getTranslation(currentLang, 'tab_video')}</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all font-mono uppercase tracking-wider ${
              activeTab === 'audio'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]'
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>{getTranslation(currentLang, 'tab_audio')}</span>
          </button>
          <button
            onClick={() => setActiveTab('subtitles')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all font-mono uppercase tracking-wider ${
              activeTab === 'subtitles'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>💬 Altyazı & Çeviri</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all font-mono uppercase tracking-wider ${
              activeTab === 'general'
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--ink-faint)] hover:text-[var(--ink)]'
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span>{getTranslation(currentLang, 'tab_network')}</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="min-h-[180px]">
          
          {/* Video Tab Content */}
          {activeTab === 'video' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                  {getTranslation(currentLang, 'lbl_video_quality')}
                </label>
                <select
                  value={preferences.active_profile}
                  onChange={(e) => handleValueChange('active_profile', e.target.value)}
                  className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-3 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                >
                  <option value="Maksimum (Best)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_max')}</option>
                  <option value="Ultra HD (2160p)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_2160')}</option>
                  <option value="QHD (1440p)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_1440')}</option>
                  <option value="Full HD (1080p)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_1080')}</option>
                  <option value="Dengeli (720p)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_720')}</option>
                  <option value="Hizli (480p)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_480')}</option>
                  <option value="Ekonomi (360p)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_quality_360')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                  {getTranslation(currentLang, 'lbl_container')}
                </label>
                <select
                  value={preferences.custom_settings?.video_container || 'mp4'}
                  onChange={(e) => handleCustomValueChange('video_container', e.target.value)}
                  className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-3 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                >
                  <option value="mp4" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_mp4')}</option>
                  <option value="mkv" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_mkv')}</option>
                  <option value="webm" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_webm')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Audio Tab Content */}
          {activeTab === 'audio' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                  {getTranslation(currentLang, 'lbl_audio_format')}
                </label>
                <select
                  value={preferences.custom_settings?.audio_format || 'mp3'}
                  onChange={(e) => handleCustomValueChange('audio_format', e.target.value)}
                  className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-3 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                >
                  <option value="mp3" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_mp3')}</option>
                  <option value="m4a" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_m4a')}</option>
                  <option value="opus" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_opus')}</option>
                  <option value="flac" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_flac')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                  {getTranslation(currentLang, 'lbl_audio_quality')}
                </label>
                <select
                  value={preferences.custom_settings?.audio_quality_preset || 'Best'}
                  onChange={(e) => handleCustomValueChange('audio_quality_preset', e.target.value)}
                  className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-3 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                >
                  <option value="Best" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_aq_best')}</option>
                  <option value="Yuksek (320K)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_aq_high')}</option>
                  <option value="Dengeli (192K)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_aq_balanced')}</option>
                  <option value="Kucuk Boyut (128K)" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_aq_economy')}</option>
                </select>
              </div>
            </div>
          )}

          {/* Subtitles & AI Auto-Translation Tab Content */}
          {activeTab === 'subtitles' && (
            <div className="flex flex-col gap-4 animate-slide-in bg-[var(--bg-recessed)] p-5 rounded-[var(--radius)] border border-[var(--hairline-strong)]">
              <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[var(--accent)] font-mono">
                    💬 Altyazı & AI Otomatik Çeviri Motoru
                  </span>
                  <span className="text-[11px] text-[var(--ink-faint)]">
                    Videolardan altyazı çekme, otomatik AI çevirisi yapma ve videoya (MP4/MKV) gömme ayarları.
                  </span>
                </div>
                <span className="text-[9px] font-mono bg-[var(--accent)]/10 text-[var(--accent)] px-2.5 py-1 rounded border border-[var(--accent)]/20 font-bold">
                  SUBTITLE & TRANSLATE ENGINE
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2 border-b border-[var(--hairline)]">
                <div className="flex items-center justify-between bg-[var(--bg-elevated)] p-3 rounded-[var(--radius)] border border-[var(--hairline)]">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[var(--ink)]">Manuel Altyazılar</span>
                    <span className="text-[10px] text-[var(--ink-faint)]">Resmi insan altyazılarını indir</span>
                  </div>
                  <div 
                    className={`toggle-sw ${preferences.subtitle_flag ? 'on' : ''}`}
                    onClick={() => handleToggle('subtitle_flag')}
                  />
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-elevated)] p-3 rounded-[var(--radius)] border border-[var(--hairline)]">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[var(--ink)]">Otomatik AI Çeviri</span>
                    <span className="text-[10px] text-[var(--ink-faint)]">Otomatik üretilen altyazılar</span>
                  </div>
                  <div 
                    className={`toggle-sw ${preferences.auto_subtitle_flag ? 'on' : ''}`}
                    onClick={() => handleToggle('auto_subtitle_flag')}
                  />
                </div>

                <div className="flex items-center justify-between bg-[var(--bg-elevated)] p-3 rounded-[var(--radius)] border border-[var(--hairline)]">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[var(--ink)]">Videoya Göm (Soft-Sub)</span>
                    <span className="text-[10px] text-[var(--ink-faint)]">MP4/MKV içine altyazı ekle</span>
                  </div>
                  <div 
                    className={`toggle-sw ${preferences.embed_subs !== false ? 'on' : ''}`}
                    onClick={() => handleToggle('embed_subs')}
                  />
                </div>
              </div>

              {/* Subtitle Languages Selector & One-Click Preset Pills */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase">
                    Hedef Altyazı & Çeviri Dilleri (Virgülle Ayrılmış ISO Kodları)
                  </label>
                  <span className="text-[10px] font-mono text-[var(--accent)] font-bold">Seçilen: {preferences.sub_langs || 'tr,en'}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={preferences.sub_langs || 'tr,en'}
                    onChange={(e) => handleValueChange('sub_langs', e.target.value)}
                    placeholder="tr,en,es,de,fr,ja,ru,all"
                    className="flex-1 rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-mono outline-none text-[var(--ink)] focus:border-[var(--accent)]"
                  />
                </div>

                {/* One-Click Language Pills */}
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-[10px] font-mono text-[var(--ink-faint)] mr-1">Hızlı Ekle / Çıkar:</span>
                  {[
                    { code: 'tr', label: '🇹🇷 Türkçe' },
                    { code: 'en', label: '🇬🇧 İngilizce' },
                    { code: 'es', label: '🇪🇸 İspanyolca' },
                    { code: 'de', label: '🇩🇪 Almanca' },
                    { code: 'fr', label: '🇫🇷 Fransızca' },
                    { code: 'ja', label: '🇯🇵 Japonca' },
                    { code: 'ru', label: '🇷🇺 Rusça' },
                    { code: 'all', label: '🌐 Tüm Diller (All)' }
                  ].map(lang => {
                    const currentLangs = (preferences.sub_langs || '').split(',').map(s => s.trim());
                    const isSelected = currentLangs.includes(lang.code);
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          let newLangs: string[];
                          if (lang.code === 'all') {
                            newLangs = ['all'];
                          } else if (isSelected) {
                            newLangs = currentLangs.filter(c => c !== lang.code && c !== 'all');
                            if (newLangs.length === 0) newLangs = ['tr'];
                          } else {
                            newLangs = [...currentLangs.filter(c => c !== 'all'), lang.code];
                          }
                          handleValueChange('sub_langs', newLangs.join(','));
                        }}
                        className={`text-[11px] font-mono px-3 py-1.5 rounded-[var(--radius)] border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)] font-bold shadow-sm'
                            : 'border-[var(--hairline-strong)] bg-[var(--bg-elevated)] text-[var(--ink-faint)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* General & Network Tab Content */}
          {activeTab === 'general' && (
            <div className="flex flex-col gap-5 animate-slide-in">
              
              {/* Toggles */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{getTranslation(currentLang, 'lbl_embed_metadata')}</span>
                  <div 
                    className={`toggle-sw ${preferences.metadata_flag ? 'on' : ''}`}
                    onClick={() => handleToggle('metadata_flag')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{getTranslation(currentLang, 'lbl_embed_thumb')}</span>
                  <div 
                    className={`toggle-sw ${preferences.thumbnail_flag ? 'on' : ''}`}
                    onClick={() => handleToggle('thumbnail_flag')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{getTranslation(currentLang, 'lbl_download_subs')}</span>
                  <div 
                    className={`toggle-sw ${preferences.subtitle_flag ? 'on' : ''}`}
                    onClick={() => handleToggle('subtitle_flag')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{getTranslation(currentLang, 'lbl_restrict_filenames')}</span>
                  <div 
                    className={`toggle-sw ${preferences.restrict_filenames ? 'on' : ''}`}
                    onClick={() => handleToggle('restrict_filenames')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{getTranslation(currentLang, 'lbl_sponsorblock')}</span>
                  <div 
                    className={`toggle-sw ${preferences.sponsorblock_enabled ? 'on' : ''}`}
                    onClick={() => handleToggle('sponsorblock_enabled')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{currentLang === 'tr' ? 'Otomatik Pano Takibi' : 'Clipboard Listener'}</span>
                  <div 
                    className={`toggle-sw ${preferences.enable_clipboard_listener !== false ? 'on' : ''}`}
                    onClick={() => handleToggle('enable_clipboard_listener')}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--ink)]">{currentLang === 'tr' ? 'Şarkı Sözleri (LRCLIB)' : 'Synced Lyrics (LRCLIB)'}</span>
                  <div 
                    className={`toggle-sw ${preferences.auto_fetch_lyrics !== false ? 'on' : ''}`}
                    onClick={() => handleToggle('auto_fetch_lyrics')}
                  />
                </div>
              </div>

              {/* Advanced Network Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--hairline)] pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                    {getTranslation(currentLang, 'lbl_max_workers')}
                  </label>
                  <select
                    value={preferences.max_workers}
                    onChange={(e) => handleValueChange('max_workers', parseInt(e.target.value))}
                    className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-2.5 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                  >
                    <option value={1} className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_workers_1')}</option>
                    <option value={2} className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_workers_2')}</option>
                    <option value={3} className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_workers_3')}</option>
                    <option value={4} className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_workers_4')}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                    {getTranslation(currentLang, 'lbl_fragments')}
                  </label>
                  <select
                    value={preferences.concurrent_fragments || '3'}
                    onChange={(e) => handleValueChange('concurrent_fragments', e.target.value)}
                    className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-2.5 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                  >
                    <option value="1" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_frag_1')}</option>
                    <option value="3" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_frag_3')}</option>
                    <option value="6" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_frag_6')}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1 flex items-center justify-between">
                    <span>{getTranslation(currentLang, 'lbl_browser_cookies')}</span>
                    <span className="text-[9px] text-green-400 font-bold">✓ OS OTO-ALGILAMA</span>
                  </label>
                  <select
                    value={preferences.browser_cookies || 'disabled'}
                    onChange={(e) => handleValueChange('browser_cookies', e.target.value)}
                    className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-2.5 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                  >
                    <option value="disabled" className="bg-[var(--bg-elevated)]">{getTranslation(currentLang, 'opt_disabled')}</option>
                    {installedBrowsers.length > 0 ? (
                      installedBrowsers.filter(b => b.id !== 'disabled').map(b => (
                        <option key={b.id} value={b.id} className="bg-[var(--bg-elevated)]">
                          {b.name} {b.installed ? ' (✓ Kurulu)' : ' (Bulunamadı)'}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="chrome" className="bg-[var(--bg-elevated)]">Google Chrome</option>
                        <option value="firefox" className="bg-[var(--bg-elevated)]">Mozilla Firefox</option>
                        <option value="edge" className="bg-[var(--bg-elevated)]">Microsoft Edge</option>
                        <option value="brave" className="bg-[var(--bg-elevated)]">Brave Browser</option>
                        <option value="opera" className="bg-[var(--bg-elevated)]">Opera</option>
                        <option value="vivaldi" className="bg-[var(--bg-elevated)]">Vivaldi</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Speed Limiter */}
              <div className="flex flex-col gap-1.5 border-t border-[var(--hairline)] pt-4">
                <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                  {currentLang === 'tr' ? 'Bant Genişliği Hız Limitörü' : 'Bandwidth Speed Limiter'}
                </label>
                <select
                  value={preferences.speed_limit || 'unlimited'}
                  onChange={(e) => handleValueChange('speed_limit', e.target.value === 'unlimited' ? null : e.target.value)}
                  className="rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] px-3.5 py-2.5 text-xs font-semibold outline-none text-[var(--ink)] cursor-pointer"
                >
                  <option value="unlimited" className="bg-[var(--bg-elevated)]">{currentLang === 'tr' ? 'Sınırsız (Maksimum Hız)' : 'Unlimited (Max Speed)'}</option>
                  <option value="1M" className="bg-[var(--bg-elevated)]">1 MB/s (Oyun & Yayın Dostu)</option>
                  <option value="3M" className="bg-[var(--bg-elevated)]">3 MB/s</option>
                  <option value="5M" className="bg-[var(--bg-elevated)]">5 MB/s (Dengeli Limit)</option>
                  <option value="10M" className="bg-[var(--bg-elevated)]">10 MB/s</option>
                  <option value="25M" className="bg-[var(--bg-elevated)]">25 MB/s</option>
                </select>
              </div>

              {/* Subtitles & AI Auto-Translation Engine Control Card */}
              <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-4 mt-1 bg-[var(--bg-recessed)] p-4 rounded-[var(--radius)] border border-[var(--hairline-strong)]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono tracking-widest text-[var(--accent)] uppercase font-bold flex items-center gap-2">
                    <span>💬 Altyazı & Otomatik Çeviri Motoru</span>
                  </span>
                  <span className="text-[9px] font-mono bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded border border-[var(--accent)]/20">
                    AI AUTO-TRANSLATE ENGINE
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2 border-b border-[var(--hairline)]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--ink)]">Manuel Altyazılar</span>
                      <span className="text-[10px] text-[var(--ink-faint)]">Resmi altyazıları indir</span>
                    </div>
                    <div 
                      className={`toggle-sw ${preferences.subtitle_flag ? 'on' : ''}`}
                      onClick={() => handleToggle('subtitle_flag')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--ink)]">Otomatik AI Çeviri</span>
                      <span className="text-[10px] text-[var(--ink-faint)]">Otomatik üretilen altyazılar</span>
                    </div>
                    <div 
                      className={`toggle-sw ${preferences.auto_subtitle_flag ? 'on' : ''}`}
                      onClick={() => handleToggle('auto_subtitle_flag')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-[var(--ink)]">Videoya Göm (Soft-Sub)</span>
                      <span className="text-[10px] text-[var(--ink-faint)]">MP4/MKV içine altyazı ekle</span>
                    </div>
                    <div 
                      className={`toggle-sw ${preferences.embed_subs !== false ? 'on' : ''}`}
                      onClick={() => handleToggle('embed_subs')}
                    />
                  </div>
                </div>

                {/* Subtitle Languages Selector & One-Click Preset Pills */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase">
                      Hedef Altyazı & Çeviri Dilleri (Virgülle Ayrılmış ISO Kodları)
                    </label>
                    <span className="text-[10px] font-mono text-[var(--accent)]">Seçilen: {preferences.sub_langs || 'tr,en'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={preferences.sub_langs || 'tr,en'}
                      onChange={(e) => handleValueChange('sub_langs', e.target.value)}
                      placeholder="tr,en,es,de,fr,ja,ru,all"
                      className="flex-1 rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-mono outline-none text-[var(--ink)] focus:border-[var(--accent)]"
                    />
                  </div>

                  {/* One-Click Language Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-mono text-[var(--ink-faint)] mr-1">Hızlı Ekle:</span>
                    {[
                      { code: 'tr', label: '🇹🇷 Türkçe' },
                      { code: 'en', label: '🇬🇧 İngilizce' },
                      { code: 'es', label: '🇪🇸 İspanyolca' },
                      { code: 'de', label: '🇩🇪 Almanca' },
                      { code: 'fr', label: '🇫🇷 Fransızca' },
                      { code: 'ja', label: '🇯🇵 Japonca' },
                      { code: 'ru', label: '🇷🇺 Rusça' },
                      { code: 'all', label: '🌐 Tüm Diller (All)' }
                    ].map(lang => {
                      const currentLangs = (preferences.sub_langs || '').split(',').map(s => s.trim());
                      const isSelected = currentLangs.includes(lang.code);
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            let newLangs: string[];
                            if (lang.code === 'all') {
                              newLangs = ['all'];
                            } else if (isSelected) {
                              newLangs = currentLangs.filter(c => c !== lang.code && c !== 'all');
                              if (newLangs.length === 0) newLangs = ['tr'];
                            } else {
                              newLangs = [...currentLangs.filter(c => c !== 'all'), lang.code];
                            }
                            handleValueChange('sub_langs', newLangs.join(','));
                          }}
                          className={`text-[10px] font-mono px-2.5 py-1 rounded-[var(--radius)] border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] font-bold'
                              : 'border-[var(--hairline-strong)] bg-[var(--bg-elevated)] text-[var(--ink-faint)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {lang.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Extra Parameters */}
              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                  {getTranslation(currentLang, 'lbl_extra_args')}
                </label>
                <div className="relative flex items-center">
                  <div className="pointer-events-none absolute left-4 text-[var(--ink-faint)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={preferences.extra_args || ''}
                    onChange={(e) => handleValueChange('extra_args', e.target.value)}
                    placeholder={getTranslation(currentLang, 'lbl_extra_args_placeholder')}
                    className="w-full rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] py-3 pl-11 pr-4 text-xs font-mono outline-none transition-all placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] text-[var(--ink)]"
                  />
                </div>
              </div>

              {/* Spotify API Integration */}
              <div className="flex flex-col gap-3 border-t border-[var(--hairline)] pt-4 mt-2">
                <span className="text-[10px] font-mono tracking-widest text-[var(--ink-dim)] uppercase px-1 font-bold">
                  🎵 Spotify Çalma Listesi İndirme Entegrasyonu
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                      Spotify Client ID
                    </label>
                    <input
                      type="text"
                      value={preferences.spotify_client_id || ''}
                      onChange={(e) => handleValueChange('spotify_client_id', e.target.value)}
                      placeholder="Spotify Client ID girin"
                      className="w-full rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] py-2.5 px-3.5 text-xs font-mono outline-none transition-all placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] text-[var(--ink)]"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono tracking-widest text-[var(--ink-faint)] uppercase px-1">
                      Spotify Client Secret
                    </label>
                    <input
                      type="password"
                      value={preferences.spotify_client_secret || ''}
                      onChange={(e) => handleValueChange('spotify_client_secret', e.target.value)}
                      placeholder="Spotify Client Secret girin"
                      className="w-full rounded-[var(--radius)] border border-[var(--hairline-strong)] bg-[var(--bg-recessed)] py-2.5 px-3.5 text-xs font-mono outline-none transition-all placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] text-[var(--ink)]"
                    />
                  </div>
                </div>
                
                <p className="text-[10px] text-[var(--ink-faint)] leading-relaxed px-1">
                  💡 Spotify çalma listelerini çözümlemek için resmi bir geliştirici hesabı gereklidir.
                  Ücretsiz olarak 1 dakikada almak için:
                  <br />
                  1. <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-[var(--accent)] underline">Spotify Developer Dashboard</a> sitesine girip giriş yapın.
                  <br />
                  2. <strong>Create App</strong> butonuna basın (App Name: Downloader, Redirect URI: http://localhost:8080 yapın).
                  <br />
                  3. Uygulamanızın ayarlarına (Settings) girip <strong>Client ID</strong> ve <strong>Client Secret</strong> kodlarını yukarıya yapıştırın.
                </p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
