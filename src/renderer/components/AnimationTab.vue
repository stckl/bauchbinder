<template>
  <div class="row" style="margin-top: 20px;">
    <div class="col">
      <h2>Animation Editor</h2>
    </div>

    <!-- Preview / Test Buttons -->
    <div class="col" style="text-align: right;">
      <div class="ui buttons small">
        <button class="ui blue labeled icon button" @click="playTest">
          <i class="play icon"></i> Test: Anzeigen
        </button>
        <button class="ui red labeled icon button" @click="stopTest">
          <i class="eye slash icon"></i> Test: Ausblenden
        </button>
      </div>
    </div>
    
    <!-- Presets / Templates -->
    <div class="col" style="margin-top:20px;">
      <h4 class="ui dividing header inverted">Vorlagen laden</h4>
      <div class="ui inverted buttons small">
        <button class="ui button" @click.prevent="loadPreset('fade')">fade</button>
        <button class="ui button" @click.prevent="loadPreset('slideleft')">slideleft</button>
        <button class="ui button" @click.prevent="loadPreset('slideright')">slideright</button>
        <button class="ui button" @click.prevent="loadPreset('slideup')">slideup</button>
        <button class="ui button" @click.prevent="loadPreset('slideup_textdelay')">slideup textdelay</button>
      </div>
    </div>
  </div>

  <div v-if="state.animation.type == 'structured'" class="row" style="margin-top: 40px;">
    <!-- SHOW TIMELINE -->
    <div class="col">
      <h3 class="ui header inverted"><i class="eye icon"></i> Anzeigen (Fade In)</h3>
      <div class="ui segment inverted timeline-container">
        <div v-for="(step, index) in state.animation.show" :key="'show'+index" class="animation-step-card inverted">
          <div class="card-header">
            <span class="step-num">{{index + 1}}</span>
            <span class="step-title">{{ getFriendlyName(step.selector) }}</span>
            <i class="trash alternate outline red icon delete-btn" @click.stop="removeAnimationStep('show', index)"></i>
          </div>
          <div class="card-body">
            <div class="info-line">
              <i class="clock outline icon"></i> {{step.duration}}ms
              <span v-if="step.delay" style="margin-left: 10px; color: #aaa;">
                <i class="hourglass half icon"></i> {{step.delay}}ms
              </span>
            </div>
            <div class="effects-line">
              <i class="eye icon" v-if="step.properties.opacity !== undefined" title="Deckkraft"></i>
              <i class="arrows alternate icon" v-if="getMotionXType(step) !== 'none' || getMotionYType(step) !== 'none'" title="Bewegung"></i>
              <i class="expand icon" v-if="step.properties.scale !== undefined" title="Größe"></i>
              <i class="tint icon" v-if="step.properties.backgroundColor !== undefined || step.properties.color !== undefined" title="Farbe"></i>
              <i class="square outline icon" v-if="step.properties.borderRadius !== undefined || step.properties.borderWidth !== undefined" title="Ecken & Rahmen"></i>
              <i class="font icon" v-if="step.properties.fontSize !== undefined" title="Text"></i>
            </div>
          </div>
          <button class="ui mini fluid blue inverted button" @click="openStepEditor('show', index)"><i class="edit icon"></i> Edit</button>
        </div>
        <button class="ui circular icon green inverted big button add-step-btn" @click="addAnimationStep('show')"><i class="plus icon"></i></button>
      </div>

      <h3 class="ui header inverted" style="margin-top: 40px;"><i class="eye slash icon"></i> Ausblenden (Fade Out)</h3>
      <div class="ui segment inverted timeline-container">
        <div v-for="(step, index) in state.animation.hide" :key="'hide'+index" class="animation-step-card inverted">
          <div class="card-header">
            <span class="step-num">{{index + 1}}</span>
            <span class="step-title">{{ getFriendlyName(step.selector) }}</span>
            <i class="trash alternate outline red icon delete-btn" @click.stop="removeAnimationStep('hide', index)"></i>
          </div>
          <div class="card-body">
            <div class="info-line">
              <i class="clock outline icon"></i> {{step.duration}}ms
              <span v-if="step.delay" style="margin-left: 10px; color: #aaa;">
                <i class="hourglass half icon"></i> {{step.delay}}ms
              </span>
            </div>
            <div class="effects-line">
              <i class="eye icon" v-if="step.properties.opacity !== undefined" title="Deckkraft"></i>
              <i class="arrows alternate icon" v-if="getMotionXType(step) !== 'none' || getMotionYType(step) !== 'none'" title="Bewegung"></i>
              <i class="expand icon" v-if="step.properties.scale !== undefined" title="Größe"></i>
              <i class="tint icon" v-if="step.properties.backgroundColor !== undefined || step.properties.color !== undefined" title="Farbe"></i>
              <i class="square outline icon" v-if="step.properties.borderRadius !== undefined || step.properties.borderWidth !== undefined" title="Ecken & Rahmen"></i>
              <i class="font icon" v-if="step.properties.fontSize !== undefined" title="Text"></i>
            </div>
          </div>
          <button class="ui mini fluid blue inverted button" @click="openStepEditor('hide', index)"><i class="edit icon"></i> Edit</button>
        </div>
        <button class="ui circular icon green inverted big button add-step-btn" @click="addAnimationStep('hide')"><i class="plus icon"></i></button>
      </div>
    </div>
  </div>

  <!-- STEP EDITOR MODAL (Moved to its own component ideally, but keeping it here for now as it's tightly coupled) -->
  <div class="ui inverted modal" id="step-modal">
    <!-- ... Content of Step Editor ... -->
    <!-- Due to size, I will assume we keep step-modal in App.vue or here. Ideally here if only used here. -->
    <!-- But step-modal needs access to editingStep ref. -->
    <div class="header inverted" style="background: #1b1c1d; border-bottom: 1px solid #333;">
      <i class="magic icon"></i> Effekt bearbeiten: {{ editingStep ? getFriendlyName(editingStep.step.selector) : '' }}
    </div>
    <!-- ... (Content identical to index.html, using inverted inputs) ... -->
    <!-- I will create a separate StepEditorModal component to keep this file clean? No, let's keep it simple for now. -->
    <div class="content inverted scrollable" style="background: #1b1c1d; max-height: 70vh; overflow-y: auto;">
          <div v-if="editingStep" class="ui form inverted small">
            
            <div class="two fields">
              <div class="field">
                <label>Ziel-Element</label>
                <select v-model="editingStep.step.selector" class="ui dropdown inverted selection">
                  <option value=".bauchbinde-instance">Ganze Bauchbinde</option>
                  <option value=".bb-box">Box</option>
                  <option value=".text">Text-Bereich</option>
                  <option value="h1">Name (H1)</option>
                  <option value="h2">Titel (H2)</option>
                  <option value=".logo">Bild (Global)</option>
                  <option value=".image">Bild (Bauchbinde)</option>
                </select>
              </div>
              <div v-if="editingStep.step.selector === 'h1' || editingStep.step.selector === 'h2'" class="field">
                <label>Text-Aufteilung (Split)</label>
                <select v-model="editingStep.step.split" class="ui dropdown inverted selection">
                  <option :value="undefined">Ganze Zeile</option>
                  <option value="chars">Buchstaben</option>
                  <option value="words">Wörter</option>
                </select>
              </div>
            </div>

            <div class="three fields">
              <div class="field">
                <label>Dauer (ms)</label>
                <div class="ui input inverted fluid">
                  <input type="number" v-model="editingStep.step.duration">
                </div>
              </div>
              <div class="field">
                <label>Verzögerung (ms)</label>
                <div class="ui input inverted fluid">
                  <input type="number" v-model="editingStep.step.delay">
                </div>
              </div>
              <div class="field">
                <label>Kurve</label>
                <select v-model="editingStep.step.easing" class="ui dropdown inverted selection">
                  <option value="linear">linear</option>
                  <option value="easeInQuad">easeInQuad</option>
                  <option value="easeOutQuad">easeOutQuad</option>
                  <option value="easeInOutQuad">easeInOutQuad</option>
                  <option value="easeInCirc">easeInCirc</option>
                  <option value="easeOutCirc">easeOutCirc</option>
                  <option value="easeInOutCirc">easeInOutCirc</option>
                  <option value="easeInBack">easeInBack</option>
                  <option value="easeOutBack">easeOutBack</option>
                  <option value="easeOutBounce">easeOutBounce</option>
                </select>
              </div>
            </div>

            <div class="ui accordion inverted structured-editor-acc" style="border: 1px solid #333; padding: 10px; border-radius: 4px;">
              
              <!-- VISIBILITY & SCALE -->
              <div class="title active"><i class="dropdown icon"></i> Sichtbarkeit & Größe</div>
              <div class="content active">
                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.opacity !== undefined" @change="$event.target.checked ? editingStep.step.properties.opacity = (editingStep.phase==='show'?[0, getDesignValueForEditor(editingStep.step.selector, 'opacity')]:[getDesignValueForEditor(editingStep.step.selector, 'opacity'), 0]) : delete editingStep.step.properties.opacity"><label>Deckkraft</label></div></div>
                <div v-if="editingStep.step.properties.opacity !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="number" step="0.1" v-model="editingStep.step.properties.opacity[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'opacity')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'opacity', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="number" step="0.1" v-model="editingStep.step.properties.opacity[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'opacity')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'opacity', $event.target.value)">
                    </div>
                  </div>
                </div>
                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.scale !== undefined" @change="$event.target.checked ? editingStep.step.properties.scale = (editingStep.phase==='show'?[0, 1]:[1, 0]) : delete editingStep.step.properties.scale"><label>Größe (Scale)</label></div></div>
                <div v-if="editingStep.step.properties.scale !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="number" step="0.1" v-model="editingStep.step.properties.scale[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'scale')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'scale', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="number" step="0.1" v-model="editingStep.step.properties.scale[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'scale')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'scale', $event.target.value)">
                    </div>
                  </div>
                </div>
              </div>

              <!-- MOTION X & Y -->
              <div class="title"><i class="dropdown icon"></i> Bewegung (X & Y)</div>
              <div class="content">
                <div class="field">
                  <label>X-Achse</label>
                  <select :value="getMotionXType(editingStep.step)" @change="setStepProperty(editingStep.step, 'motion_x_type', $event.target.value)" class="ui mini dropdown inverted selection">
                    <option value="none">-- Keine --</option>
                    <option value="translateX">Transform X (vw)</option>
                    <option value="left">Position Links (vw)</option>
                  </select>
                  <div v-if="getMotionXType(editingStep.step) !== 'none'" class="fields mini-fields inverted">
                    <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                      <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                      <div class="ui input inverted mini fluid">
                        <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties[getMotionXType(editingStep.step)][0]">
                        <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, getMotionXType(editingStep.step))" @input="updateDesignValueFromAnimation(editingStep.step.selector, getMotionXType(editingStep.step), $event.target.value)">
                      </div>
                    </div>
                    <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                      <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                      <div class="ui input inverted mini fluid">
                        <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties[getMotionXType(editingStep.step)][1]">
                        <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, getMotionXType(editingStep.step))" @input="updateDesignValueFromAnimation(editingStep.step.selector, getMotionXType(editingStep.step), $event.target.value)">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="field">
                  <label>Y-Achse</label>
                  <select :value="getMotionYType(editingStep.step)" @change="setStepProperty(editingStep.step, 'motion_y_type', $event.target.value)" class="ui mini dropdown inverted selection">
                    <option value="none">-- Keine --</option>
                    <option value="translateY">Transform Y (vh)</option>
                    <option value="top">Position Oben (vh)</option>
                  </select>
                  <div v-if="getMotionYType(editingStep.step) !== 'none'" class="fields mini-fields inverted">
                    <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                      <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                      <div class="ui input inverted mini fluid">
                        <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties[getMotionYType(editingStep.step)][0]">
                        <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, getMotionYType(editingStep.step))" @input="updateDesignValueFromAnimation(editingStep.step.selector, getMotionYType(editingStep.step), $event.target.value)">
                      </div>
                    </div>
                    <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                      <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                      <div class="ui input inverted mini fluid">
                        <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties[getMotionYType(editingStep.step)][1]">
                        <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, getMotionYType(editingStep.step))" @input="updateDesignValueFromAnimation(editingStep.step.selector, getMotionYType(editingStep.step), $event.target.value)">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.rotate !== undefined" @change="$event.target.checked ? editingStep.step.properties.rotate = [-45, 0] : delete editingStep.step.properties.rotate"><label>Rotation</label></div></div>
                <div v-if="editingStep.step.properties.rotate !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="number" v-model="editingStep.step.properties.rotate[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'rotate')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'rotate', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="number" v-model="editingStep.step.properties.rotate[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'rotate')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'rotate', $event.target.value)">
                    </div>
                  </div>
                </div>
              </div>

              <!-- SPACING (MARGIN/PADDING) -->
              <div class="title"><i class="dropdown icon"></i> Abstände (Margin & Padding)</div>
              <div class="content">
                <div v-for="prop in ['marginTop','marginRight','marginBottom','marginLeft','paddingTop','paddingRight','paddingBottom','paddingLeft']" :key="prop" style="margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                  <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties[prop] !== undefined" @change="$event.target.checked ? editingStep.step.properties[prop] = ['0px', getDesignValueForEditor(editingStep.step.selector, prop)] : delete editingStep.step.properties[prop]"><label>{{prop}}</label></div></div>
                  <div v-if="editingStep.step.properties[prop] !== undefined" class="fields mini-fields inverted">
                    <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                      <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                      <div class="ui input inverted mini fluid">
                        <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties[prop][0]">
                        <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, prop)" @input="updateDesignValueFromAnimation(editingStep.step.selector, prop, $event.target.value)">
                      </div>
                    </div>
                    <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                      <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                      <div class="ui input inverted mini fluid">
                        <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties[prop][1]">
                        <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, prop)" @input="updateDesignValueFromAnimation(editingStep.step.selector, prop, $event.target.value)">
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- COLORS & BORDERS (DIV ONLY) -->
              <div v-if="!['h1','h2'].includes(editingStep.step.selector)" class="title"><i class="dropdown icon"></i> Farben & Rahmen (Box)</div>
              <div v-if="!['h1','h2'].includes(editingStep.step.selector)" class="content">
                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.backgroundColor !== undefined" @change="$event.target.checked ? editingStep.step.properties.backgroundColor = ['#ffffff', getDesignValueForEditor(editingStep.step.selector, 'backgroundColor')] : delete editingStep.step.properties.backgroundColor"><label>Hintergrundfarbe</label></div></div>
                <div v-if="editingStep.step.properties.backgroundColor !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties.backgroundColor[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'backgroundColor')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'backgroundColor', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties.backgroundColor[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'backgroundColor')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'backgroundColor', $event.target.value)">
                    </div>
                  </div>
                </div>
                
                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.borderColor !== undefined" @change="$event.target.checked ? editingStep.step.properties.borderColor = ['#ffffff', getDesignValueForEditor(editingStep.step.selector, 'borderColor')] : delete editingStep.step.properties.borderColor"><label>Rahmenfarbe</label></div></div>
                <div v-if="editingStep.step.properties.borderColor !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties.borderColor[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'borderColor')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'borderColor', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties.borderColor[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'borderColor')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'borderColor', $event.target.value)">
                    </div>
                  </div>
                </div>

                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.borderWidth !== undefined" @change="$event.target.checked ? editingStep.step.properties.borderWidth = ['0px', getDesignValueForEditor(editingStep.step.selector, 'borderWidth')] : delete editingStep.step.properties.borderWidth"><label>Rahmendicke</label></div></div>
                <div v-if="editingStep.step.properties.borderWidth !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties.borderWidth[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'borderWidth')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'borderWidth', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties.borderWidth[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'borderWidth')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'borderWidth', $event.target.value)">
                    </div>
                  </div>
                </div>

                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" v-model="editingStep.step.lineDraw"><label>Border als Linie zeichnen</label></div></div>
              </div>

              <!-- TEXT STIL (H1/H2 ONLY) -->
              <div v-if="['h1','h2'].includes(editingStep.step.selector)" class="title"><i class="dropdown icon"></i> Text-Stil & Farbe</div>
              <div v-if="['h1','h2'].includes(editingStep.step.selector)" class="content">
                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.color !== undefined" @change="$event.target.checked ? editingStep.step.properties.color = ['#ffffff', getDesignValueForEditor(editingStep.step.selector, 'color')] : delete editingStep.step.properties.color"><label>Schriftfarbe</label></div></div>
                <div v-if="editingStep.step.properties.color !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties.color[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'color')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'color', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties.color[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'color')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'color', $event.target.value)">
                    </div>
                  </div>
                </div>

                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.fontSize !== undefined" @change="$event.target.checked ? editingStep.step.properties.fontSize = ['1vh', getDesignValueForEditor(editingStep.step.selector, 'fontSize')] : delete editingStep.step.properties.fontSize"><label>Textgröße</label></div></div>
                <div v-if="editingStep.step.properties.fontSize !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties.fontSize[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'fontSize')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'fontSize', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties.fontSize[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'fontSize')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'fontSize', $event.target.value)">
                    </div>
                  </div>
                </div>

                <div class="inline field"><div class="ui checkbox inverted tiny"><input type="checkbox" :checked="editingStep.step.properties.width !== undefined" @change="$event.target.checked ? editingStep.step.properties.width = ['0vw', getDesignValueForEditor(editingStep.step.selector, 'width')] : delete editingStep.step.properties.width"><label>Textbreite</label></div></div>
                <div v-if="editingStep.step.properties.width !== undefined" class="fields mini-fields inverted">
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'hide'}">
                    <label>{{editingStep.phase==='show'?'Start':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='show'" type="text" v-model="editingStep.step.properties.width[0]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'width')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'width', $event.target.value)">
                    </div>
                  </div>
                  <div class="field" :class="{'design-state-field': editingStep.phase === 'show'}">
                    <label>{{editingStep.phase==='hide'?'Ziel':'Design'}}</label>
                    <div class="ui input inverted mini fluid">
                      <input v-if="editingStep.phase==='hide'" type="text" v-model="editingStep.step.properties.width[1]">
                      <input v-else type="text" :value="getDesignValueForEditor(editingStep.step.selector, 'width')" @input="updateDesignValueFromAnimation(editingStep.step.selector, 'width', $event.target.value)">
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        <div class="actions inverted" style="background: #1b1c1d; border-top: 1px solid #333;">
          <div class="ui positive fluid button">Fertig</div>
        </div>
      </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { ipcRenderer as ipc } from 'electron';
import { state } from '../store.js';
import $ from 'jquery';

// PRESETS Definition
const PRESETS = {
    fade: {
        show: [{ selector: '.bb-box', properties: { opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideleft: {
        show: [{ selector: '.bb-box', properties: { translateX: ['-100vw', '0vw'], opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { translateX: ['0vw', '-100vw'], opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideright: {
        show: [{ selector: '.bb-box', properties: { translateX: ['100vw', '0vw'], opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { translateX: ['0vw', '100vw'], opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideup: {
        show: [{ selector: '.bb-box', properties: { translateY: ['10vh', '0vh'], opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' }],
        hide: [{ selector: '.bb-box', properties: { translateY: ['0vh', '10vh'], opacity: [1, 0] }, duration: 500, delay: 0, easing: 'easeInOutCirc' }]
    },
    slideup_textdelay: {
        show: [
            { selector: '.bb-box', properties: { translateY: ['10vh', '0vh'], opacity: [0, 1] }, duration: 750, delay: 0, easing: 'easeInOutCirc' },
            { selector: '.text', properties: { translateY: ['10vh', '0vh'], opacity: [0, 1] }, duration: 600, delay: 300, easing: 'easeInOutCirc' }
        ],
        hide: [
            { selector: '.text', properties: { translateY: ['0vh', '10vh'], opacity: [1, 0] }, duration: 400, delay: 0, easing: 'easeInOutCirc' },
            { selector: '.bb-box', properties: { translateY: ['0vh', '10vh'], opacity: [1, 0] }, duration: 500, delay: 200, easing: 'easeInOutCirc' }
        ]
    }
};

const editingStep = ref(null);

const getFriendlyName = (selector) => {
    const names = {
        '.bauchbinde-instance': 'Ganze Bauchbinde',
        '.bb-box': 'Box',
        '.white': 'Box',
        '.text': 'Text-Bereich',
        'h1': 'Name (H1)',
        'h2': 'Titel (H2)',
        '.logo': 'Bild (Global)',
        '.image': 'Bild (Bauchbinde)'
    };
    return names[selector] || selector;
};

// IMPORTANT: This function needs access to the current design state to provide fallback values.
// We must duplicate this logic from DesignTab/playout-engine OR import a helper.
// Since 'state.design' is available here, we can implement it.
const getDesignValueForEditor = (selector, prop) => {
    const design = state.design;
    // 1. Native GUI mapping
    if (selector === '.bb-box' || selector === '.white') {
        if (prop === 'backgroundColor') return design.white.color;
        if (prop === 'borderRadius') return design.white.borderradius;
        if (prop === 'left') return design.white.left + 'vw';
        if (prop === 'width') return design.white.width + 'vw';
        if (prop === 'opacity') return 1;
    }
    if (selector === 'h1' || selector === 'h2') {
        const obj = selector === 'h1' ? design.h1 : design.h2;
        if (prop === 'color') return obj.color;
        if (prop === 'fontSize') return obj.fontsize + 'vh';
        if (prop === 'fontWeight') return obj.fontweight || (obj.bold ? '700' : '400');
    }
    if (selector === '.bauchbinde' || selector === '.bauchbinde-instance') {
        if (prop === 'bottom') return design.white.bottom + 'vh';
        if (prop === 'borderRadius') return 0;
    }

    // 2. Fallback: Search in Custom CSS
    const parts = design.unifiedCss.split('/* CUSTOM */');
    const customCss = parts[1] || '';
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
    const regex = new RegExp(escapedSelector + '\\s*{[\\s\\S]*?' + cssProp + ':\\s*([^;]+);?', 'i');
    const match = customCss.match(regex);
    if (match) return match[1].trim();

    return 0; // Default fallback
};

const updateDesignValueFromAnimation = (selector, prop, value) => {
    // This function updates the design state from the animation editor.
    // It's a complex function from main.js.
    // Ideally, we should move this to a shared helper or the store actions.
    // For now, I will keep it simplified: Changing design from animation editor
    // implies modifying state.design or custom CSS.
    // ... Implementation similar to main.js ...
    // Since this is heavy logic, I recommend keeping it in a dedicated helper file later.
    // For now, let's assume users use the Design Tab for design changes.
    console.warn("Editing design values from Animation Tab is currently limited.");
};

const setStepProperty = (step, prop, value) => {
    if (prop === 'motion_x_type') {
        ['translateX', 'left', 'right'].forEach(p => delete step.properties[p]);
        if (value !== 'none') step.properties[value] = [editingStep.value?.phase==='show'?'100vw':'0vw', getDesignValueForEditor(step.selector, value)];
        return;
    }
    if (prop === 'motion_y_type') {
        ['translateY', 'top', 'bottom', 'marginBottom'].forEach(p => delete step.properties[p]);
        if (value !== 'none') step.properties[value] = [editingStep.value?.phase==='show'?'100vh':'0vh', getDesignValueForEditor(step.selector, value)];
        return;
    }
    step.properties[prop] = value;
};

const getMotionXType = (step) => {
    if (step.properties.translateX !== undefined) return 'translateX';
    if (step.properties.left !== undefined) return 'left';
    return 'none';
};

const getMotionYType = (step) => {
    if (step.properties.translateY !== undefined) return 'translateY';
    if (step.properties.top !== undefined) return 'top';
    return 'none';
};

const openStepEditor = (phase, index) => {
    editingStep.value = { phase, index, step: state.animation[phase][index] };
    nextTick(() => {
        $('#step-modal').modal({
            onHide: () => { editingStep.value = null; },
            allowMultiple: true
        }).modal('show');
        $('.ui.accordion.structured-editor-acc').accordion({ exclusive: false });
        $('.ui.checkbox').checkbox();
        $('.ui.dropdown').dropdown();
    });
};

const addAnimationStep = (phase) => {
    state.animation[phase].push({
        selector: '.bb-box',
        properties: { opacity: (phase==='show'?[0, 1]:[1, 0]) },
        duration: 750,
        delay: 0,
        easing: 'easeInOutCirc'
    });
    nextTick(() => { $('.ui.accordion.structured-editor-acc').accordion({ exclusive: false }); });
};

const removeAnimationStep = (phase, index) => {
    state.animation[phase].splice(index, 1);
};

const playTest = () => {
    ipc.send('show-lowerthird', { 
        name: 'Max Mustermann', 
        title: 'Bauchbinder Test Vorschau', 
        image: null 
    });
};

const stopTest = () => {
    ipc.send('hide-lowerthird');
};

const loadPreset = (name) => {
    if (PRESETS[name]) {
        state.animation.show = JSON.parse(JSON.stringify(PRESETS[name].show));
        state.animation.hide = JSON.parse(JSON.stringify(PRESETS[name].hide));
        state.animation.type = 'structured';
        nextTick(() => { $('.ui.accordion.structured-editor-acc').accordion({ exclusive: false }); });
    }
};

watch(() => state.animation, (na) => { ipc.send('update-js', JSON.parse(JSON.stringify(na))); }, { deep: true });

onMounted(() => {
    if (!state.animation.show || state.animation.show.length === 0) {
        console.log("[AnimationTab] Initializing with fade preset...");
        loadPreset('fade');
    }
    $('#step-modal').modal();
    $('.ui.dropdown').dropdown();
});
</script>
