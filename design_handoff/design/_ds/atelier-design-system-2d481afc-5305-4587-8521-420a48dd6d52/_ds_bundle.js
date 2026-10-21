/* @ds-bundle: {"format":4,"namespace":"AtelierDesignSystem_2d481a","components":[{"name":"Button","sourcePath":"components/actions/Button.jsx"},{"name":"IconButton","sourcePath":"components/actions/IconButton.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"AnswerCard","sourcePath":"components/forms/AnswerCard.jsx"},{"name":"BigTextField","sourcePath":"components/forms/BigTextField.jsx"},{"name":"Chip","sourcePath":"components/forms/Chip.jsx"},{"name":"QuestionProgress","sourcePath":"components/forms/QuestionProgress.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"TextInput","sourcePath":"components/forms/TextInput.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"TopBar","sourcePath":"components/navigation/TopBar.jsx"},{"name":"BottomSheet","sourcePath":"components/overlays/BottomSheet.jsx"},{"name":"Coachmark","sourcePath":"components/overlays/Coachmark.jsx"},{"name":"CtaPlate","sourcePath":"components/overlays/CtaPlate.jsx"},{"name":"EmptyState","sourcePath":"components/overlays/EmptyState.jsx"},{"name":"BigStat","sourcePath":"components/stats/BigStat.jsx"},{"name":"PageDots","sourcePath":"components/stats/PageDots.jsx"},{"name":"SegmentedControl","sourcePath":"components/stats/SegmentedControl.jsx"},{"name":"StatTile","sourcePath":"components/stats/StatTile.jsx"},{"name":"TickBars","sourcePath":"components/stats/TickBars.jsx"},{"name":"LimitCounter","sourcePath":"components/status/LimitCounter.jsx"},{"name":"PlanBadge","sourcePath":"components/status/PlanBadge.jsx"},{"name":"Toast","sourcePath":"components/status/Toast.jsx"},{"name":"WeatherPill","sourcePath":"components/status/WeatherPill.jsx"},{"name":"CanvasItem","sourcePath":"components/wardrobe/CanvasItem.jsx"},{"name":"ItemTile","sourcePath":"components/wardrobe/ItemTile.jsx"},{"name":"OutfitHero","sourcePath":"components/wardrobe/OutfitHero.jsx"}],"sourceHashes":{"components/actions/Button.jsx":"c01884d7c061","components/actions/IconButton.jsx":"ba33068e8c1a","components/core/Icon.jsx":"e62dbcd4c19d","components/forms/AnswerCard.jsx":"4136e331998c","components/forms/BigTextField.jsx":"08ac4adb64f6","components/forms/Chip.jsx":"210092618a59","components/forms/QuestionProgress.jsx":"b7a521826888","components/forms/Switch.jsx":"31d86b7d1c54","components/forms/TextInput.jsx":"c2e163d021fc","components/navigation/TabBar.jsx":"6eae6b1be5ab","components/navigation/TopBar.jsx":"4bb79f8df307","components/overlays/BottomSheet.jsx":"7baf523012fd","components/overlays/Coachmark.jsx":"edabed7c36d9","components/overlays/CtaPlate.jsx":"6320b3230752","components/overlays/EmptyState.jsx":"ec96d7155c1a","components/stats/BigStat.jsx":"1c3be8d05595","components/stats/PageDots.jsx":"3c4e4b514e89","components/stats/SegmentedControl.jsx":"efa5f8d80dc5","components/stats/StatTile.jsx":"d2cbbcf1c3b6","components/stats/TickBars.jsx":"093fee8a7fd3","components/status/LimitCounter.jsx":"847dd58a8409","components/status/PlanBadge.jsx":"62f9007f33b7","components/status/Toast.jsx":"f8b40a69769d","components/status/WeatherPill.jsx":"e16f7a682248","components/wardrobe/CanvasItem.jsx":"f06d965529ea","components/wardrobe/ItemTile.jsx":"06e1f72c1ecd","components/wardrobe/OutfitHero.jsx":"77f69a799eac","ui_kits/app/Screens.jsx":"b1fa47c04d60"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AtelierDesignSystem_2d481a = window.AtelierDesignSystem_2d481a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Icon.jsx
try { (() => {
function Icon({
  name,
  fill = false,
  size = 24,
  color = 'currentColor',
  style,
  title
}) {
  return /*#__PURE__*/React.createElement("i", {
    className: (fill ? 'ph-fill' : 'ph') + ' ph-' + name,
    "aria-hidden": title ? undefined : 'true',
    "aria-label": title,
    style: {
      fontSize: size,
      width: size,
      height: size,
      color,
      lineHeight: 1,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/actions/Button.jsx
try { (() => {
function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconRight,
  disabled = false,
  pressed: forcePressed,
  loading = false,
  glass = false,
  fullWidth = false,
  onClick,
  style
}) {
  const [p, setP] = React.useState(false);
  const pressed = forcePressed ?? p;
  const h = size === 'sm' ? 44 : 56;
  const base = {
    height: variant === 'text' ? 44 : h,
    minWidth: 44,
    padding: variant === 'text' ? '0 8px' : size === 'sm' ? '0 18px' : '0 28px',
    width: fullWidth ? '100%' : undefined,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: size === 'sm' && variant !== 'primary' ? 'var(--radius-chip)' : 'var(--radius-full)',
    font: 'var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui)',
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    WebkitTapHighlightColor: 'transparent',
    transform: pressed && !disabled ? 'scale(0.97)' : 'none',
    transition: 'transform var(--dur-spring) var(--ease-spring), filter var(--dur-fast), background var(--dur-fast), opacity var(--dur-fast)'
  };
  const v = {
    primary: disabled ? {
      background: 'var(--bg-sunken)',
      color: 'var(--ink-tertiary)'
    } : {
      background: 'var(--gradient-sunset-cta, var(--gradient-sunset))',
      color: 'var(--ink-on-accent)',
      boxShadow: pressed ? 'none' : 'var(--shadow-cta)',
      filter: pressed ? 'brightness(0.92)' : 'none'
    },
    secondary: {
      background: glass ? undefined : pressed ? 'var(--bg-sunken)' : 'var(--bg-elevated)',
      border: glass ? undefined : '1px solid var(--line)',
      color: disabled ? 'var(--ink-tertiary)' : 'var(--ink-primary)',
      opacity: disabled ? 0.6 : 1,
      filter: glass && pressed ? 'brightness(0.94)' : 'none'
    },
    text: {
      background: 'transparent',
      color: disabled ? 'var(--ink-tertiary)' : pressed ? 'var(--accent-pressed)' : 'var(--accent)'
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: onClick,
    className: variant === 'secondary' && glass ? 'glass' : undefined,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onPointerLeave: () => setP(false),
    style: {
      ...base,
      ...v,
      ...style
    }
  }, loading ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "circle-notch",
    size: 20,
    style: {
      animation: 'spin 0.9s linear infinite'
    }
  }) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22
  }) : null, children, iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: 20
  }), /*#__PURE__*/React.createElement("style", null, '@keyframes spin{to{transform:rotate(360deg)}}'));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/Button.jsx", error: String((e && e.message) || e) }); }

// components/actions/IconButton.jsx
try { (() => {
function IconButton({
  icon,
  label,
  variant = 'glass',
  selected = false,
  disabled = false,
  pressed: forcePressed,
  size = 44,
  onClick,
  style
}) {
  const [p, setP] = React.useState(false);
  const pressed = forcePressed ?? p;
  const bg = variant === 'solid' ? pressed ? 'var(--bg-sunken)' : 'var(--bg-elevated)' : variant === 'plain' ? pressed ? 'var(--bg-sunken)' : 'transparent' : undefined;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    "aria-pressed": selected,
    disabled: disabled,
    onClick: onClick,
    className: variant === 'glass' ? 'glass' : undefined,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onPointerLeave: () => setP(false),
    style: {
      width: size,
      height: size,
      borderRadius: 'var(--radius-full)',
      padding: 0,
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: disabled ? 'default' : 'pointer',
      border: variant === 'solid' ? '1px solid var(--line)' : variant === 'plain' ? 'none' : undefined,
      background: selected && variant !== 'glass' ? 'var(--accent-soft)' : bg,
      color: disabled ? 'var(--ink-tertiary)' : selected ? 'var(--accent)' : 'var(--ink-primary)',
      opacity: disabled ? 0.55 : 1,
      WebkitTapHighlightColor: 'transparent',
      transform: pressed && !disabled ? 'scale(0.9)' : 'none',
      filter: pressed && variant === 'glass' ? 'brightness(0.94)' : 'none',
      transition: 'transform var(--dur-spring) var(--ease-spring), color var(--dur-fast)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    fill: selected,
    size: Math.round(size * 0.5)
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/actions/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/AnswerCard.jsx
try { (() => {
function AnswerCard({
  title,
  subtitle,
  image,
  icon,
  layout = 'row',
  selected = false,
  disabled = false,
  error = false,
  pressed: forcePressed,
  onClick,
  style
}) {
  const [p, setP] = React.useState(false);
  const pressed = forcePressed ?? p;
  const tile = layout === 'tile';
  const ring = error ? 'var(--error)' : selected ? 'var(--accent)' : 'transparent';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    "aria-pressed": selected,
    onClick: onClick,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onPointerLeave: () => setP(false),
    style: {
      position: 'relative',
      width: '100%',
      minHeight: 64,
      boxSizing: 'border-box',
      textAlign: 'left',
      display: 'flex',
      flexDirection: tile ? 'column' : 'row',
      alignItems: tile ? 'stretch' : 'center',
      gap: tile ? 10 : 14,
      padding: tile ? 8 : '10px 16px 10px 10px',
      borderRadius: 'var(--radius-tile)',
      background: 'var(--bg-elevated)',
      border: 'none',
      boxShadow: `inset 0 0 0 2px ${ring}, var(--shadow-card)`,
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'default' : 'pointer',
      WebkitTapHighlightColor: 'transparent',
      transform: pressed && !disabled ? 'scale(0.98)' : 'none',
      transition: 'transform var(--dur-spring) var(--ease-spring), box-shadow var(--dur-fast)',
      ...style
    }
  }, (image || icon) && /*#__PURE__*/React.createElement("span", {
    style: {
      flexShrink: 0,
      width: tile ? '100%' : 48,
      height: tile ? undefined : 48,
      aspectRatio: tile ? '1 / 1' : undefined,
      borderRadius: tile ? 14 : 12,
      background: 'var(--item-mat)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--ink-tertiary)'
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: tile ? 40 : 24
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      flex: 1,
      minWidth: 0,
      padding: tile ? '0 6px 6px' : 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui)',
      color: 'var(--ink-primary)'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: error ? 'var(--error)' : 'var(--ink-secondary)'
    }
  }, subtitle)), selected && /*#__PURE__*/React.createElement("span", {
    style: {
      position: tile ? 'absolute' : 'static',
      top: 14,
      right: 14,
      width: 24,
      height: 24,
      borderRadius: 999,
      background: 'var(--accent)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 15,
    style: {
      fontWeight: 700
    }
  })));
}
Object.assign(__ds_scope, { AnswerCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/AnswerCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Chip.jsx
try { (() => {
function Chip({
  label,
  icon,
  emoji,
  variant = 'occasion',
  selected = false,
  disabled = false,
  pressed: forcePressed,
  onClick,
  style
}) {
  const [p, setP] = React.useState(false);
  const pressed = forcePressed ?? p;
  const suggestion = variant === 'suggestion';
  const bg = selected ? 'var(--chip-bg-selected)' : suggestion ? 'var(--accent-soft)' : 'var(--chip-bg)';
  const fg = disabled ? 'var(--ink-tertiary)' : selected ? 'var(--chip-fg-selected)' : suggestion ? 'var(--accent)' : 'var(--ink-primary)';
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    "aria-pressed": selected,
    onClick: onClick,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onPointerLeave: () => setP(false),
    style: {
      height: suggestion ? 36 : 40,
      padding: '0 14px',
      borderRadius: 'var(--radius-chip)',
      border: 'none',
      flexShrink: 0,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: bg,
      color: fg,
      opacity: disabled ? 0.55 : 1,
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      whiteSpace: 'nowrap',
      cursor: disabled ? 'default' : 'pointer',
      WebkitTapHighlightColor: 'transparent',
      transform: pressed && !disabled ? 'scale(0.95)' : 'none',
      filter: pressed && !disabled ? 'brightness(0.95)' : 'none',
      transition: 'transform var(--dur-spring) var(--ease-spring), background var(--dur-fast), color var(--dur-fast)',
      ...style
    }
  }, emoji ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: 16
    }
  }, emoji) : icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    fill: selected,
    size: 18
  }) : null, label);
}
Object.assign(__ds_scope, { Chip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Chip.jsx", error: String((e && e.message) || e) }); }

// components/forms/BigTextField.jsx
try { (() => {
function BigTextField({
  value,
  defaultValue = '',
  placeholder,
  suggestions = [],
  onChange,
  onSuggestion,
  error,
  disabled = false,
  focused: forceFocus,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const [f, setF] = React.useState(false);
  const v = value ?? inner;
  const focused = forceFocus ?? f;
  const set = x => {
    setInner(x);
    onChange && onChange(x);
  };
  const line = error ? 'var(--error)' : focused ? 'var(--accent)' : 'var(--line)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    value: v,
    placeholder: placeholder,
    disabled: disabled,
    onChange: e => set(e.target.value),
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      width: '100%',
      boxSizing: 'border-box',
      border: 'none',
      borderBottom: `2px solid ${line}`,
      background: 'transparent',
      outline: 'none',
      padding: '8px 0 10px',
      font: '600 var(--type-field-size)/1.75rem var(--font-ui)',
      color: 'var(--ink-primary)',
      borderRadius: 0,
      transition: 'border-color var(--dur-fast)'
    }
  }), error && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: 'var(--error)',
      marginTop: -4
    }
  }, error), suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }
  }, suggestions.map(s => /*#__PURE__*/React.createElement(__ds_scope.Chip, {
    key: s,
    label: s,
    variant: "suggestion",
    disabled: disabled,
    onClick: () => {
      set(s);
      onSuggestion && onSuggestion(s);
    }
  }))));
}
Object.assign(__ds_scope, { BigTextField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/BigTextField.jsx", error: String((e && e.message) || e) }); }

// components/forms/QuestionProgress.jsx
try { (() => {
function QuestionProgress({
  step = 1,
  total = 5,
  onBack,
  onSkip,
  skipLabel = 'Пропустить',
  style
}) {
  const pct = Math.max(0, Math.min(1, step / total)) * 100;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      minHeight: 44,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u041D\u0430\u0437\u0430\u0434",
    onClick: onBack,
    style: {
      width: 44,
      height: 44,
      border: 'none',
      background: 'transparent',
      color: 'var(--ink-primary)',
      padding: 0,
      cursor: 'pointer',
      visibility: onBack ? 'visible' : 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "caret-left",
    size: 24
  })), /*#__PURE__*/React.createElement("div", {
    role: "progressbar",
    "aria-valuemin": 0,
    "aria-valuemax": total,
    "aria-valuenow": step,
    style: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      background: 'var(--bg-sunken)',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + '%',
      height: '100%',
      borderRadius: 999,
      background: 'var(--accent)',
      transition: 'width var(--dur-spring) var(--ease-out)'
    }
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onSkip,
    style: {
      height: 44,
      padding: '0 4px 0 8px',
      border: 'none',
      background: 'transparent',
      color: 'var(--ink-secondary)',
      cursor: 'pointer',
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      visibility: onSkip ? 'visible' : 'hidden'
    }
  }, skipLabel));
}
Object.assign(__ds_scope, { QuestionProgress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/QuestionProgress.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  defaultChecked = false,
  label,
  description,
  disabled = false,
  onChange,
  style
}) {
  const [inner, setInner] = React.useState(defaultChecked);
  const on = checked ?? inner;
  const toggle = () => {
    if (disabled) return;
    setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "switch",
    "aria-checked": on,
    "aria-disabled": disabled,
    tabIndex: 0,
    onClick: toggle,
    onKeyDown: e => (e.key === ' ' || e.key === 'Enter') && toggle(),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minHeight: 44,
      cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-body-weight) var(--type-body-size)/var(--type-body-lh) var(--font-ui)',
      color: 'var(--ink-primary)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: 'var(--ink-secondary)'
    }
  }, description)), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 51,
      height: 31,
      borderRadius: 999,
      flexShrink: 0,
      position: 'relative',
      background: on ? 'var(--accent)' : 'var(--line)',
      transition: 'background var(--dur-fast)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 2,
      left: on ? 22 : 2,
      width: 27,
      height: 27,
      borderRadius: 999,
      background: '#fff',
      boxShadow: '0 2px 6px rgba(23,23,26,0.18)',
      transition: 'left var(--dur-spring) var(--ease-spring)'
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/TextInput.jsx
try { (() => {
function TextInput({
  label,
  value,
  defaultValue = '',
  placeholder,
  type = 'text',
  icon,
  error,
  hint,
  disabled = false,
  focused: forceFocus,
  onChange,
  inputMode,
  style
}) {
  const [inner, setInner] = React.useState(defaultValue);
  const [f, setF] = React.useState(false);
  const focused = forceFocus ?? f;
  const ring = error ? 'var(--error)' : focused ? 'var(--accent)' : 'transparent';
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: 'var(--ink-secondary)',
      paddingLeft: 4
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 56,
      padding: '0 16px',
      borderRadius: 'var(--radius-input)',
      background: 'var(--surface-input)',
      boxShadow: `inset 0 0 0 ${focused || error ? 2 : 0}px ${ring}`,
      transition: 'box-shadow var(--dur-fast)'
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22,
    color: "var(--ink-tertiary)"
  }), /*#__PURE__*/React.createElement("input", {
    type: type,
    value: value ?? inner,
    placeholder: placeholder,
    disabled: disabled,
    inputMode: inputMode,
    onChange: e => {
      setInner(e.target.value);
      onChange && onChange(e.target.value);
    },
    onFocus: () => setF(true),
    onBlur: () => setF(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      font: 'var(--type-body-weight) var(--type-body-size)/var(--type-body-lh) var(--font-ui)',
      color: 'var(--ink-primary)'
    }
  }), error && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "warning-circle",
    size: 22,
    color: "var(--error)"
  })), (error || hint) && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: error ? 'var(--error)' : 'var(--ink-tertiary)',
      paddingLeft: 4
    }
  }, error || hint));
}
Object.assign(__ds_scope, { TextInput });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/TextInput.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
const DEFAULT_TABS = [{
  id: 'outfit',
  label: 'Образ',
  icon: 'sparkle'
}, {
  id: 'wardrobe',
  label: 'Гардероб',
  icon: 'coat-hanger'
}, {
  id: 'favorites',
  label: 'Избранное',
  icon: 'heart'
}, {
  id: 'profile',
  label: 'Профиль',
  icon: 'user'
}];
function TabBar({
  active = 'outfit',
  tabs = DEFAULT_TABS,
  onChange,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    className: "glass",
    style: {
      display: 'flex',
      gap: 2,
      padding: 6,
      borderRadius: 'var(--radius-full)',
      boxSizing: 'border-box',
      width: '100%',
      maxWidth: 350,
      ...style
    }
  }, tabs.map(t => {
    const on = t.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: t.id,
      type: "button",
      onClick: () => onChange && onChange(t.id),
      "aria-current": on ? 'page' : undefined,
      style: {
        flex: '1 1 0',
        minWidth: 0,
        height: 56,
        border: 'none',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        background: on ? 'var(--accent-soft)' : 'transparent',
        color: on ? 'var(--accent)' : 'var(--ink-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: 0,
        font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
        transition: 'background var(--dur-spring) var(--ease-out), color var(--dur-fast)',
        WebkitTapHighlightColor: 'transparent'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: t.icon,
      fill: on,
      size: 24
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        whiteSpace: 'nowrap',
        fontWeight: on ? 600 : 500
      }
    }, t.label));
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TopBar.jsx
try { (() => {
function TopBar({
  left,
  title,
  right,
  glass = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: glass ? 'glass' : undefined,
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 8,
      minHeight: 56,
      padding: '6px',
      borderRadius: 'var(--radius-full)',
      boxSizing: 'border-box',
      width: '100%',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      justifySelf: 'start'
    }
  }, left), /*#__PURE__*/React.createElement("div", {
    style: {
      font: 'var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui)',
      color: 'var(--ink-primary)',
      textAlign: 'center'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      justifySelf: 'end'
    }
  }, right));
}
Object.assign(__ds_scope, { TopBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TopBar.jsx", error: String((e && e.message) || e) }); }

// components/overlays/BottomSheet.jsx
try { (() => {
function BottomSheet({
  title,
  subtitle,
  children,
  footer,
  animated = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    className: "glass",
    style: {
      borderRadius: 'var(--radius-sheet) var(--radius-sheet) 0 0',
      borderBottom: 'none',
      padding: '10px 20px calc(24px + var(--safe-bottom))',
      boxSizing: 'border-box',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      animation: animated ? 'at-sheet-up var(--dur-spring) var(--ease-out)' : 'none',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      background: 'var(--ink-tertiary)',
      opacity: 0.5
    }
  }), (title || subtitle) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      paddingTop: 4
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: 'var(--type-title2-weight) var(--type-title2-size)/var(--type-title2-lh) var(--font-ui)',
      color: 'var(--ink-primary)',
      textWrap: 'pretty'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      color: 'var(--ink-secondary)',
      textWrap: 'pretty'
    }
  }, subtitle)), children, footer);
}
Object.assign(__ds_scope, { BottomSheet });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/BottomSheet.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Coachmark.jsx
try { (() => {
// Spotlight: dims the screen to 60%, cuts out the target with its own radius, glass card next to it.
function Coachmark({
  target = {
    x: 20,
    y: 400,
    width: 350,
    height: 56,
    radius: 999
  },
  title,
  text,
  okLabel = 'Понятно',
  onOk,
  placement = 'above',
  step,
  style
}) {
  const t = target;
  const cardTop = placement === 'above' ? undefined : t.y + t.height + 16;
  const cardBottom = placement === 'above' ? `calc(100% - ${t.y - 16}px)` : undefined;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      zIndex: 50,
      overflow: 'hidden',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: t.x,
      top: t.y,
      width: t.width,
      height: t.height,
      borderRadius: t.radius,
      boxShadow: '0 0 0 9999px var(--scrim), 0 0 0 3px rgba(255,255,255,0.9), 0 0 32px 8px rgba(255,177,153,0.55)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "glass",
    style: {
      position: 'absolute',
      left: 20,
      right: 20,
      top: cardTop,
      bottom: cardBottom,
      borderRadius: 'var(--radius-card)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }
  }, step && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-micro-weight) var(--type-micro-size)/var(--type-micro-lh) var(--font-ui)',
      letterSpacing: 'var(--type-micro-tracking)',
      textTransform: 'uppercase',
      color: 'var(--accent)'
    }
  }, step), title && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui)',
      color: 'var(--ink-primary)'
    }
  }, title), text && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      color: 'var(--ink-secondary)',
      textWrap: 'pretty'
    }
  }, text), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: 4
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: "secondary",
    size: "sm",
    onClick: onOk
  }, okLabel))));
}
Object.assign(__ds_scope, { Coachmark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Coachmark.jsx", error: String((e && e.message) || e) }); }

// components/overlays/CtaPlate.jsx
try { (() => {
function CtaPlate({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "glass",
    style: {
      padding: 12,
      paddingBottom: 'calc(12px + var(--safe-bottom))',
      borderRadius: 'var(--radius-card)',
      boxSizing: 'border-box',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style
    }
  }, children);
}
Object.assign(__ds_scope, { CtaPlate });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/CtaPlate.jsx", error: String((e && e.message) || e) }); }

// components/overlays/EmptyState.jsx
try { (() => {
function EmptyState({
  illustration,
  icon = 'coat-hanger',
  title,
  text,
  actionLabel,
  actionVariant = 'secondary',
  onAction,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 12,
      padding: '24px 20px',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 132,
      height: 132,
      borderRadius: 999,
      background: 'var(--gradient-sunset-soft)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
      overflow: 'hidden'
    }
  }, illustration ? /*#__PURE__*/React.createElement("img", {
    src: illustration,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'contain'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 56,
    color: "var(--accent)"
  })), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      font: 'var(--type-title2-weight) var(--type-title2-size)/var(--type-title2-lh) var(--font-ui)',
      color: 'var(--ink-primary)',
      textWrap: 'balance'
    }
  }, title), text && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 300,
      font: 'var(--type-body-weight) var(--type-body-size)/var(--type-body-lh) var(--font-ui)',
      color: 'var(--ink-secondary)',
      textWrap: 'pretty'
    }
  }, text), actionLabel && /*#__PURE__*/React.createElement(__ds_scope.Button, {
    variant: actionVariant,
    onClick: onAction,
    style: {
      marginTop: 8
    }
  }, actionLabel));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/stats/BigStat.jsx
try { (() => {
function BigStat({
  value,
  unit,
  label,
  trend,
  trendIcon,
  align = 'left',
  size = 'xl',
  glow = false,
  color = 'var(--ink-primary)',
  style
}) {
  const fs = {
    xl: '6rem',
    lg: '4.5rem',
    md: '3rem'
  }[size] || '6rem';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'right' ? 'flex-end' : 'flex-start',
      textAlign: align,
      gap: 6,
      ...style
    }
  }, glow && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      left: align === 'right' ? 'auto' : '-30%',
      right: align === 'right' ? '-30%' : 'auto',
      top: '-25%',
      width: '120%',
      height: '120%',
      background: 'radial-gradient(closest-side, rgba(255,177,153,0.85), rgba(242,102,94,0.45) 55%, rgba(181,98,127,0) 100%)',
      filter: 'blur(18px)',
      zIndex: 0,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'baseline',
      gap: 4,
      color,
      fontFamily: 'var(--font-ui)',
      fontWeight: 800,
      fontSize: fs,
      lineHeight: 0.92,
      letterSpacing: '-0.05em',
      fontVariantNumeric: 'proportional-nums'
    }
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.36em',
      fontWeight: 700,
      letterSpacing: '-0.01em'
    }
  }, unit)), (label || trend) && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      color: 'var(--ink-secondary)',
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)'
    }
  }, trendIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trendIcon,
    size: 16
  }), trend || label));
}
Object.assign(__ds_scope, { BigStat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/BigStat.jsx", error: String((e && e.message) || e) }); }

// components/stats/PageDots.jsx
try { (() => {
function PageDots({
  count = 5,
  active = 0,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 5,
      alignItems: 'center',
      justifyContent: 'center',
      ...style
    }
  }, Array.from({
    length: count
  }, (_, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      width: i === active ? 22 : 5,
      height: 5,
      borderRadius: 999,
      background: i === active ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
      opacity: i === active ? 1 : 0.5,
      transition: 'width var(--dur-spring) var(--ease-spring)'
    }
  })));
}
Object.assign(__ds_scope, { PageDots });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/PageDots.jsx", error: String((e && e.message) || e) }); }

// components/stats/SegmentedControl.jsx
try { (() => {
function SegmentedControl({
  options = [],
  value,
  onChange,
  glass = true,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: glass ? 'glass' : undefined,
    role: "tablist",
    style: {
      display: 'inline-flex',
      gap: 2,
      padding: 4,
      borderRadius: 'var(--radius-full)',
      background: glass ? undefined : 'var(--bg-sunken)',
      ...style
    }
  }, options.map(o => {
    const opt = typeof o === 'string' ? {
      value: o,
      label: o
    } : o;
    const on = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      role: "tab",
      "aria-selected": on,
      "aria-label": opt.label,
      onClick: () => onChange && onChange(opt.value),
      style: {
        height: 44,
        minWidth: 44,
        padding: opt.label && !opt.iconOnly ? '0 18px' : 0,
        border: 'none',
        borderRadius: 'var(--radius-full)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: on ? 'var(--ink-primary)' : 'transparent',
        color: on ? 'var(--bg-elevated)' : 'var(--ink-secondary)',
        font: 'var(--type-callout-weight) var(--type-callout-size)/1 var(--font-ui)',
        fontWeight: 700,
        transition: 'background var(--dur-spring) var(--ease-out), color var(--dur-fast)'
      }
    }, opt.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: opt.icon,
      fill: on,
      size: 20
    }), !opt.iconOnly && opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/stats/StatTile.jsx
try { (() => {
function StatTile({
  value,
  unit,
  label,
  icon,
  tone = 'elevated',
  size = 'md',
  style
}) {
  const tones = {
    elevated: {
      bg: 'var(--bg-elevated)',
      fg: 'var(--ink-primary)',
      sub: 'var(--ink-secondary)',
      ic: 'var(--accent)'
    },
    soft: {
      bg: 'var(--accent-soft)',
      fg: 'var(--ink-primary)',
      sub: 'var(--ink-secondary)',
      ic: 'var(--accent)'
    },
    sunken: {
      bg: 'var(--bg-sunken)',
      fg: 'var(--ink-primary)',
      sub: 'var(--ink-secondary)',
      ic: 'var(--ink-primary)'
    },
    ink: {
      bg: 'var(--ink-primary)',
      fg: 'var(--bg-elevated)',
      sub: 'rgba(255,255,255,0.7)',
      ic: 'var(--sunset-1)'
    },
    plain: {
      bg: 'transparent',
      fg: 'var(--ink-primary)',
      sub: 'var(--ink-secondary)',
      ic: 'var(--accent)'
    }
  };
  const t = tones[tone] || tones.elevated;
  const big = size === 'lg' ? '2.25rem' : size === 'sm' ? '1.375rem' : '1.875rem';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      padding: tone === 'plain' ? 0 : '16px 16px 14px',
      borderRadius: 'var(--radius-tile)',
      background: t.bg,
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 2,
      color: t.fg,
      fontFamily: 'var(--font-ui)',
      fontWeight: 800,
      fontSize: big,
      lineHeight: 1,
      letterSpacing: '-0.03em',
      fontVariantNumeric: 'proportional-nums'
    }
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.5em',
      fontWeight: 700,
      letterSpacing: 0
    }
  }, unit)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      color: t.sub,
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      minWidth: 0
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    fill: true,
    size: 15,
    color: t.ic
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, label)));
}
Object.assign(__ds_scope, { StatTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/StatTile.jsx", error: String((e && e.message) || e) }); }

// components/stats/TickBars.jsx
try { (() => {
function TickBars({
  value = 0,
  max = 20,
  count = 20,
  variant = 'rising',
  labels,
  height = 56,
  activeColor = 'var(--accent)',
  style
}) {
  const active = Math.round(value / max * count);
  const ticks = Array.from({
    length: count
  }, (_, i) => i);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "img",
    "aria-label": value + ' из ' + max,
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      gap: variant === 'lines' ? 3 : 4,
      height
    }
  }, ticks.map(i => {
    const on = i < active;
    const h = variant === 'rising' ? 30 + 70 * i / (count - 1) : 100;
    return /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        flex: 1,
        minWidth: 2,
        height: h + '%',
        borderRadius: 999,
        background: on ? activeColor : variant === 'lines' ? 'var(--line)' : 'var(--bg-sunken)',
        transition: 'background var(--dur-spring) var(--ease-out), height var(--dur-spring) var(--ease-spring)',
        transitionDelay: i * 12 + 'ms'
      }
    });
  })), labels && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      font: '600 11px/13px var(--font-ui)',
      color: 'var(--ink-tertiary)'
    }
  }, labels.map(l => /*#__PURE__*/React.createElement("span", {
    key: l
  }, l))));
}
Object.assign(__ds_scope, { TickBars });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/stats/TickBars.jsx", error: String((e && e.message) || e) }); }

// components/status/LimitCounter.jsx
try { (() => {
function LimitCounter({
  remaining = 3,
  total = 5,
  label = 'на этой неделе',
  title,
  size = 'compact',
  moreLabel = 'Больше образов',
  onMore,
  unlimited = false,
  style
}) {
  const empty = remaining <= 0 && !unlimited;
  const last = remaining === 1;
  const segColor = i => {
    if (empty) return 'var(--bg-sunken)';
    if (i >= remaining) return 'var(--line)';
    return last ? 'var(--warning)' : 'var(--accent)';
  };
  const segs = Array.from({
    length: Math.min(total, 10)
  }, (_, i) => i);
  const caption = {
    font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
    color: 'var(--ink-secondary)'
  };
  const more = onMore !== undefined && (empty || size === 'large') && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onMore,
    style: {
      border: 'none',
      background: 'transparent',
      padding: '0 0 0 8px',
      height: 44,
      cursor: 'pointer',
      color: 'var(--accent)',
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      fontWeight: 600,
      whiteSpace: 'nowrap'
    }
  }, moreLabel);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: size === 'large' ? 12 : 8,
      ...style
    }
  }, size === 'large' ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, title && /*#__PURE__*/React.createElement("span", {
    style: caption
  }, title), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-display-weight) var(--type-display-size)/var(--type-display-lh) var(--font-ui)',
      letterSpacing: '-0.02em',
      color: empty ? 'var(--ink-tertiary)' : last ? 'var(--warning)' : 'var(--ink-primary)'
    }
  }, unlimited ? '∞' : remaining), !unlimited && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui)',
      color: 'var(--ink-tertiary)'
    }
  }, "\u0438\u0437 ", total))), more) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: empty ? 44 : 20
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      color: empty ? 'var(--ink-tertiary)' : 'var(--ink-secondary)'
    }
  }, title ? title + ' · ' : '', empty ? 'Образы на неделю закончились' : /*#__PURE__*/React.createElement(React.Fragment, null, "\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: last ? 'var(--warning)' : 'var(--ink-primary)',
      fontWeight: 700
    }
  }, remaining, " \u0438\u0437 ", total), " ", label)), more), !unlimited && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 4,
      opacity: empty ? 0.6 : 1
    }
  }, segs.map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      flex: 1,
      height: 4,
      borderRadius: 999,
      background: segColor(i),
      transition: 'background var(--dur-spring)'
    }
  }))));
}
Object.assign(__ds_scope, { LimitCounter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/LimitCounter.jsx", error: String((e && e.message) || e) }); }

// components/status/PlanBadge.jsx
try { (() => {
const PLANS = {
  free: {
    label: 'FREE',
    bg: 'var(--bg-sunken)',
    fg: 'var(--ink-secondary)'
  },
  sub: {
    label: 'ПОДПИСКА',
    bg: 'var(--accent-soft)',
    fg: 'var(--accent)'
  },
  plus: {
    label: 'ПОДПИСКА+',
    bg: 'var(--gradient-sunset-cta, var(--gradient-sunset))',
    fg: '#fff'
  }
};
function PlanBadge({
  plan = 'free',
  label,
  style
}) {
  const p = PLANS[plan] || PLANS.free;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      height: 22,
      padding: '0 10px',
      borderRadius: 'var(--radius-full)',
      background: p.bg,
      color: p.fg,
      font: 'var(--type-micro-weight) var(--type-micro-size)/var(--type-micro-lh) var(--font-ui)',
      letterSpacing: 'var(--type-micro-tracking)',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      ...style
    }
  }, label || p.label);
}
Object.assign(__ds_scope, { PlanBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/PlanBadge.jsx", error: String((e && e.message) || e) }); }

// components/status/Toast.jsx
try { (() => {
const TONES = {
  success: {
    icon: 'check-circle',
    color: 'var(--success)'
  },
  error: {
    icon: 'warning-circle',
    color: 'var(--error)'
  },
  offline: {
    icon: 'wifi-slash',
    color: 'var(--ink-secondary)'
  },
  neutral: {
    icon: 'info',
    color: 'var(--accent)'
  }
};
function Toast({
  text,
  tone = 'success',
  icon,
  action,
  onAction,
  style
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    className: "glass",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      padding: '0 18px 0 14px',
      borderRadius: 'var(--radius-full)',
      maxWidth: '100%',
      boxSizing: 'border-box',
      animation: 'at-toast-in var(--dur-spring) var(--ease-spring)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    fill: true,
    size: 22,
    color: t.color
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)',
      color: 'var(--ink-primary)',
      fontWeight: 600
    }
  }, text), action && /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onAction,
    style: {
      border: 'none',
      background: 'transparent',
      color: 'var(--accent)',
      font: '600 var(--type-callout-size)/1 var(--font-ui)',
      cursor: 'pointer',
      padding: '0 0 0 6px',
      height: 44
    }
  }, action));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/Toast.jsx", error: String((e && e.message) || e) }); }

// components/status/WeatherPill.jsx
try { (() => {
function WeatherPill({
  icon = 'cloud-sun',
  temp = '+12°',
  city = 'Москва',
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    className: "glass",
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      height: 44,
      padding: '0 16px 0 12px',
      borderRadius: 'var(--radius-full)',
      color: 'var(--ink-primary)',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24,
    color: "var(--accent)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui)'
    }
  }, temp), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: 'var(--ink-secondary)'
    }
  }, city));
}
Object.assign(__ds_scope, { WeatherPill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/status/WeatherPill.jsx", error: String((e && e.message) || e) }); }

// components/wardrobe/CanvasItem.jsx
try { (() => {
const CAT_ICON = {
  top: 't-shirt',
  outer: 'hoodie',
  bottom: 'pants',
  dress: 'dress',
  shoes: 'sneaker',
  bag: 'handbag',
  accessory: 'sunglasses',
  hat: 'baseball-cap'
};
const handle = {
  position: 'absolute',
  width: 14,
  height: 14,
  borderRadius: 999,
  background: '#fff',
  border: '2px solid var(--accent)',
  boxSizing: 'border-box'
};
function CanvasItem({
  src,
  category = 'top',
  label,
  x = 0,
  y = 0,
  width = 140,
  height = 140,
  rotate = 0,
  selected = false,
  onClick,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      position: 'absolute',
      left: x,
      top: y,
      width,
      height,
      transform: `rotate(${rotate}deg)`,
      cursor: 'grab',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: label || '',
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      filter: 'drop-shadow(0 6px 16px rgba(23,23,26,0.14))'
    }
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: 16,
      background: '#F7F7FA',
      boxShadow: 'var(--shadow-item)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#B4B4BD'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: CAT_ICON[category] || 't-shirt',
    size: 40
  }))), selected && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6,
      border: '1.5px solid var(--accent)',
      borderRadius: 6,
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...handle,
      left: -13,
      top: -13
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...handle,
      right: -13,
      top: -13
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...handle,
      left: -13,
      bottom: -13
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...handle,
      right: -13,
      bottom: -13,
      width: 20,
      height: 20,
      right: -16,
      bottom: -16,
      background: 'var(--accent)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrows-out-simple",
    size: 12
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: '50%',
      top: -40,
      width: 1.5,
      height: 28,
      background: 'var(--accent)',
      transform: 'translateX(-50%)'
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...handle,
      left: '50%',
      top: -52,
      width: 24,
      height: 24,
      transform: 'translateX(-50%)',
      background: 'var(--accent)',
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-clockwise",
    size: 14
  }))));
}
Object.assign(__ds_scope, { CanvasItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/wardrobe/CanvasItem.jsx", error: String((e && e.message) || e) }); }

// components/wardrobe/ItemTile.jsx
try { (() => {
const CAT_ICON = {
  top: 't-shirt',
  outer: 'hoodie',
  bottom: 'pants',
  dress: 'dress',
  shoes: 'sneaker',
  bag: 'handbag',
  accessory: 'sunglasses',
  hat: 'baseball-cap'
};
function ItemTile({
  src,
  alt = '',
  category = 'top',
  label,
  unavailable = false,
  unavailableLabel = 'в стирке',
  selected = false,
  loading = false,
  error,
  pressed: forcePressed,
  onClick,
  style
}) {
  const [p, setP] = React.useState(false);
  const pressed = forcePressed ?? p;
  const ring = error ? 'var(--error)' : selected ? 'var(--accent)' : 'transparent';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    "aria-pressed": selected,
    "aria-label": alt || label,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onPointerLeave: () => setP(false),
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: '1 / 1',
      padding: 0,
      border: 'none',
      borderRadius: 'var(--radius-tile)',
      overflow: 'hidden',
      background: loading ? 'linear-gradient(90deg,var(--item-mat) 0%,#F7F7FA 50%,var(--item-mat) 100%)' : 'var(--item-mat)',
      backgroundSize: '200% 100%',
      animation: loading ? 'at-shimmer 1.4s linear infinite' : 'none',
      boxShadow: `inset 0 0 0 2px ${ring}`,
      cursor: onClick ? 'pointer' : 'default',
      transform: pressed ? 'scale(0.96)' : 'none',
      transition: 'transform var(--dur-spring) var(--ease-spring)',
      WebkitTapHighlightColor: 'transparent'
    }
  }, !loading && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      inset: '12%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: unavailable ? 0.4 : 1,
      animation: 'at-reveal 500ms var(--ease-out)'
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      maxWidth: '100%',
      maxHeight: '100%',
      objectFit: 'contain',
      filter: 'drop-shadow(0 6px 16px rgba(23,23,26,0.10))'
    }
  }) : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: CAT_ICON[category] || 't-shirt',
    size: 44,
    color: "#B4B4BD"
  })), unavailable && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      left: 8,
      bottom: 8,
      height: 22,
      padding: '0 8px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.85)',
      color: '#6B6B74',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      font: '600 11px/13px var(--font-ui)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "drop",
    size: 12
  }), unavailableLabel), selected && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 999,
      background: 'var(--accent)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 15
  })), error && /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 24,
      height: 24,
      borderRadius: 999,
      background: 'var(--error)',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "exclamation-mark",
    size: 15
  }))), label && /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui)',
      color: typeof error === 'string' ? 'var(--error)' : 'var(--ink-secondary)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      paddingLeft: 2
    }
  }, typeof error === 'string' ? error : label));
}
Object.assign(__ds_scope, { ItemTile });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/wardrobe/ItemTile.jsx", error: String((e && e.message) || e) }); }

// components/wardrobe/OutfitHero.jsx
try { (() => {
const CAT_ICON = {
  top: 't-shirt',
  outer: 'hoodie',
  bottom: 'pants',
  dress: 'dress',
  shoes: 'sneaker',
  bag: 'handbag',
  accessory: 'sunglasses',
  hat: 'baseball-cap'
};
// "laid out on a bed": outer + top up top, bottom below, shoes at the foot, accessories at the side
const SLOTS = {
  outer: {
    left: '6%',
    top: '4%',
    width: '46%',
    height: '46%',
    rotate: -6,
    z: 2
  },
  top: {
    left: '38%',
    top: '6%',
    width: '40%',
    height: '40%',
    rotate: 4,
    z: 3
  },
  bottom: {
    left: '24%',
    top: '40%',
    width: '38%',
    height: '50%',
    rotate: -2,
    z: 1
  },
  shoes: {
    left: '56%',
    top: '66%',
    width: '30%',
    height: '26%',
    rotate: 8,
    z: 4
  },
  accessory: {
    left: '74%',
    top: '30%',
    width: '22%',
    height: '24%',
    rotate: 10,
    z: 5
  },
  bag: {
    left: '4%',
    top: '58%',
    width: '26%',
    height: '28%',
    rotate: -8,
    z: 4
  }
};
function OutfitHero({
  items = [],
  explanation,
  liked = null,
  onLike,
  onDislike,
  loading = false,
  hint,
  aspect = '1 / 1.05',
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      width: '100%',
      aspectRatio: aspect,
      borderRadius: 20,
      background: 'var(--item-mat)',
      overflow: 'hidden'
    }
  }, items.map((it, i) => {
    const s = SLOTS[it.slot] || SLOTS.top;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: 'absolute',
        left: s.left,
        top: s.top,
        width: s.width,
        height: s.height,
        zIndex: s.z,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: `rotate(${s.rotate}deg)`,
        animation: loading ? `at-shuffle 2.4s ${i * 0.2}s ease-in-out infinite` : `at-fly-in var(--dur-spring) ${i * 60}ms var(--ease-spring) both`
      }
    }, it.src ? /*#__PURE__*/React.createElement("img", {
      src: it.src,
      alt: it.label || '',
      style: {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        filter: 'drop-shadow(0 6px 16px rgba(23,23,26,0.14))'
      }
    }) : /*#__PURE__*/React.createElement("span", {
      style: {
        width: '100%',
        height: '100%',
        borderRadius: 18,
        background: '#F7F7FA',
        boxShadow: 'var(--shadow-item)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'center',
        justifyContent: 'center',
        color: '#B4B4BD'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: CAT_ICON[it.slot] || 't-shirt',
      size: 36
    }), it.label && /*#__PURE__*/React.createElement("span", {
      style: {
        font: '500 11px/13px var(--font-ui)',
        color: '#A0A0A9'
      }
    }, it.label)));
  }), !loading && (onLike || onDislike) && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 10,
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "thumbs-up",
    label: "\u041D\u0440\u0430\u0432\u0438\u0442\u0441\u044F",
    selected: liked === true,
    onClick: onLike
  }), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "thumbs-down",
    label: "\u041D\u0435 \u043D\u0440\u0430\u0432\u0438\u0442\u0441\u044F",
    selected: liked === false,
    onClick: onDislike
  }))), explanation && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 4px',
      font: 'var(--type-body-weight) var(--type-body-size)/var(--type-body-lh) var(--font-ui)',
      color: 'var(--ink-secondary)',
      textWrap: 'pretty'
    }
  }, explanation), hint && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '0 4px',
      padding: '10px 12px',
      borderRadius: 'var(--radius-chip)',
      background: 'var(--accent-soft)',
      color: 'var(--ink-primary)',
      font: 'var(--type-callout-weight) var(--type-callout-size)/var(--type-callout-lh) var(--font-ui)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sneaker",
    size: 20,
    color: "var(--accent)"
  }), hint));
}
Object.assign(__ds_scope, { OutfitHero });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/wardrobe/OutfitHero.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/Screens.jsx
try { (() => {
const __ns = window.AtelierDesignSystem_2d481a || {};
const __safe = n => __ns[n] || (() => null);
const [Button, IconButton, Icon, Chip, BigTextField, WeatherPill, LimitCounter, OutfitHero, ItemTile, PlanBadge, Switch, Toast, BottomSheet, CtaPlate, EmptyState, StatTile, BigStat, TickBars, SegmentedControl, PageDots] = ['Button', 'IconButton', 'Icon', 'Chip', 'BigTextField', 'WeatherPill', 'LimitCounter', 'OutfitHero', 'ItemTile', 'PlanBadge', 'Switch', 'Toast', 'BottomSheet', 'CtaPlate', 'EmptyState', 'StatTile', 'BigStat', 'TickBars', 'SegmentedControl', 'PageDots'].map(__safe);
const card = {
  background: 'var(--bg-elevated)',
  borderRadius: 'var(--radius-card)',
  padding: 20
};
const OCCASIONS = [['Каждый день', 'sun'], ['Работа', 'briefcase'], ['Свидание', 'heart'], ['Прогулка', 'tree'], ['Вечеринка', 'confetti']];
const OUTFIT = [{
  slot: 'outer',
  label: 'Тренч'
}, {
  slot: 'top',
  label: 'Футболка'
}, {
  slot: 'bottom',
  label: 'Джинсы'
}, {
  slot: 'shoes',
  label: 'Кеды'
}, {
  slot: 'accessory',
  label: 'Очки'
}];
const pad = {
  padding: '0 20px'
};
const h1 = {
  margin: 0,
  font: 'var(--type-title1-weight) var(--type-title1-size)/var(--type-title1-lh) var(--font-ui)',
  letterSpacing: '-0.01em'
};
function OutfitScreen({
  remaining,
  onBuild,
  state
}) {
  const [occ, setOcc] = React.useState('Каждый день');
  if (state === 'loading') return /*#__PURE__*/React.createElement("div", {
    style: {
      ...pad,
      paddingTop: 64,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: h1
  }, "\u0421\u043E\u0431\u0438\u0440\u0430\u044E \u043E\u0431\u0440\u0430\u0437"), /*#__PURE__*/React.createElement(OutfitHero, {
    items: OUTFIT,
    loading: true
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--ink-secondary)',
      textAlign: 'center'
    }
  }, "\u0421\u043C\u043E\u0442\u0440\u044E \u043F\u043E\u0433\u043E\u0434\u0443 \u0438 \u0442\u0432\u043E\u0438 \u0432\u0435\u0449\u0438"));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...pad,
      paddingTop: 56,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      paddingBottom: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(WeatherPill, {
    icon: "cloud-sun",
    temp: "\u041E\u0431\u043B\u0430\u0447\u043D\u043E",
    city: "\u041C\u043E\u0441\u043A\u0432\u0430"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    variant: "solid"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-callout-weight) var(--type-callout-size)/1.25rem var(--font-ui)',
      color: 'var(--ink-secondary)'
    }
  }, "\u0412\u0442, 20 \u043E\u043A\u0442"), /*#__PURE__*/React.createElement("h1", {
    style: {
      ...h1,
      fontSize: '2rem',
      lineHeight: '2.25rem',
      fontWeight: 800
    }
  }, "\u0427\u0442\u043E \u043D\u0430\u0434\u0435\u043D\u0435\u043C \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 18,
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    size: "sm",
    value: "4",
    unit: "\u043C/\u0441",
    label: "\u0412\u0435\u0442\u0435\u0440",
    icon: "wind"
  }), /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    size: "sm",
    value: "20",
    unit: "%",
    label: "\u0414\u043E\u0436\u0434\u044C",
    icon: "drop"
  }))), /*#__PURE__*/React.createElement(BigStat, {
    value: "+12",
    unit: "\xB0",
    size: "lg",
    align: "right",
    label: "\u043E\u0449\u0443\u0449\u0430\u0435\u0442\u0441\u044F +9",
    glow: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      margin: '0 -20px',
      padding: '0 20px',
      scrollbarWidth: 'none'
    }
  }, OCCASIONS.map(([l, i]) => /*#__PURE__*/React.createElement(Chip, {
    key: l,
    label: l,
    icon: i,
    selected: occ === l,
    onClick: () => setOcc(l)
  }))), /*#__PURE__*/React.createElement(BigTextField, {
    placeholder: "\u041F\u043E\u0436\u0435\u043B\u0430\u043D\u0438\u0435, \u0435\u0441\u043B\u0438 \u0435\u0441\u0442\u044C",
    suggestions: ['Удобно', 'Ярко', 'Теплее', 'Без каблуков']
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      display: 'flex',
      flexDirection: 'column',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    size: "lg",
    value: remaining,
    unit: " \u0438\u0437 5",
    label: "AI-\u043E\u0431\u0440\u0430\u0437\u043E\u0432 \u043D\u0430 \u044D\u0442\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435",
    icon: "sparkle"
  }), remaining <= 1 && /*#__PURE__*/React.createElement(Button, {
    variant: "text",
    size: "sm"
  }, "\u0411\u043E\u043B\u044C\u0448\u0435 \u043E\u0431\u0440\u0430\u0437\u043E\u0432")), /*#__PURE__*/React.createElement(TickBars, {
    value: remaining,
    max: 5,
    count: 20,
    height: 40,
    activeColor: remaining === 1 ? 'var(--warning)' : 'var(--accent)'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 20,
      right: 20,
      bottom: 104
    }
  }, remaining > 0 ? /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    icon: "sparkle",
    onClick: onBuild
  }, "\u0421\u043E\u0431\u0440\u0430\u0442\u044C \u043E\u0431\u0440\u0430\u0437") : /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    variant: "secondary",
    icon: "lock-simple"
  }, "\u0411\u043E\u043B\u044C\u0448\u0435 \u043E\u0431\u0440\u0430\u0437\u043E\u0432")));
}
function ReadyScreen({
  onBack,
  onSave,
  onAgain
}) {
  const [liked, setLiked] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...pad,
      paddingTop: 56,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "caret-left",
    label: "\u041D\u0430\u0437\u0430\u0434",
    variant: "solid",
    onClick: onBack
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-headline-weight) var(--type-headline-size)/1 var(--font-ui)'
    }
  }, "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "share-network",
    label: "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F",
    variant: "solid"
  })), /*#__PURE__*/React.createElement(OutfitHero, {
    items: OUTFIT,
    liked: liked,
    onLike: () => setLiked(true),
    onDislike: () => setLiked(false),
    explanation: "\u0422\u0440\u0435\u043D\u0447 \u0437\u0430\u043A\u0440\u043E\u0435\u0442 \u043E\u0442 \u0432\u0435\u0442\u0440\u0430, \u0441\u0432\u0435\u0442\u043B\u044B\u0439 \u0432\u0435\u0440\u0445 \u043E\u0441\u0432\u0435\u0436\u0438\u0442, \u043A\u0435\u0434\u044B \u043D\u0430 \u0432\u0435\u0441\u044C \u0434\u0435\u043D\u044C"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 4px'
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    size: "sm",
    value: "5",
    label: "\u0432\u0435\u0449\u0435\u0439",
    icon: "coat-hanger"
  }), /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    size: "sm",
    value: "92",
    unit: "%",
    label: "\u043F\u043E\u0434 \u043F\u043E\u0433\u043E\u0434\u0443",
    icon: "cloud-sun"
  }), /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    size: "sm",
    value: "2",
    label: "\u043D\u043E\u0432\u044B\u0445 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u044F",
    icon: "sparkle"
  })), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    icon: "t-shirt"
  }, "\u041D\u0430\u0434\u0435\u0432\u0430\u044E \u0441\u0435\u0433\u043E\u0434\u043D\u044F"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 8
    }
  }, [['bookmark-simple', 'Сохранить', onSave], ['arrows-clockwise', 'Другой', onAgain], ['swap', 'Заменить'], ['pencil-simple', 'Изменить']].map(([i, l, f]) => /*#__PURE__*/React.createElement("button", {
    key: l,
    onClick: f,
    style: {
      border: 'none',
      background: 'var(--bg-elevated)',
      borderRadius: 20,
      height: 72,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      color: 'var(--ink-primary)',
      font: 'var(--type-caption-weight) var(--type-caption-size)/1 var(--font-ui)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: 24
  }), l))));
}
const CATS = ['Все', 'Верх', 'Низ', 'Верхняя', 'Обувь', 'Аксессуары'];
const ITEMS = [['outer', 'Тренч'], ['top', 'Футболка'], ['bottom', 'Джинсы'], ['shoes', 'Кеды'], ['dress', 'Платье', true], ['top', 'Рубашка'], ['bag', 'Сумка'], ['bottom', 'Юбка'], ['accessory', 'Очки']];
function WardrobeScreen({
  empty
}) {
  const [cat, setCat] = React.useState('Все');
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...pad,
      paddingTop: 56,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: h1
  }, "\u0413\u0430\u0440\u0434\u0435\u0440\u043E\u0431"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "magnifying-glass",
    label: "\u041F\u043E\u0438\u0441\u043A",
    variant: "solid"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "sliders-horizontal",
    label: "\u0424\u0438\u043B\u044C\u0442\u0440\u044B",
    variant: "solid"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      overflowX: 'auto',
      margin: '0 -20px',
      padding: '0 20px',
      scrollbarWidth: 'none'
    }
  }, CATS.map(c => /*#__PURE__*/React.createElement(Chip, {
    key: c,
    label: c,
    selected: cat === c,
    onClick: () => setCat(c)
  }))), !empty && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    size: "sm",
    value: "18",
    label: "\u0432\u0435\u0449\u0435\u0439",
    icon: "coat-hanger"
  }), /*#__PURE__*/React.createElement(StatTile, {
    size: "sm",
    value: "1",
    label: "\u0432 \u0441\u0442\u0438\u0440\u043A\u0435",
    icon: "drop",
    tone: "sunken"
  }), /*#__PURE__*/React.createElement(StatTile, {
    size: "sm",
    value: "12",
    label: "\u0444\u043E\u0442\u043E",
    icon: "camera",
    tone: "soft"
  })), empty ? /*#__PURE__*/React.createElement(EmptyState, {
    icon: "coat-hanger",
    title: "\u0428\u043A\u0430\u0444 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442",
    text: "\u0414\u043E\u0431\u0430\u0432\u044C 5 \u0432\u0435\u0449\u0435\u0439, \u0438 \u044F \u0441\u043E\u0431\u0435\u0440\u0443 \u043F\u0435\u0440\u0432\u044B\u0439 \u043E\u0431\u0440\u0430\u0437",
    actionLabel: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0435\u0449\u044C"
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 12
    }
  }, ITEMS.map(([c, l, u], i) => /*#__PURE__*/React.createElement(ItemTile, {
    key: i,
    category: c,
    label: l,
    unavailable: u
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 20,
      bottom: 108
    }
  }, /*#__PURE__*/React.createElement("button", {
    "aria-label": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u0435\u0449\u044C",
    style: {
      width: 60,
      height: 60,
      borderRadius: 999,
      border: 'none',
      background: 'var(--ink-primary)',
      color: 'var(--bg-elevated)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 24px rgba(17,17,20,.25)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 28
  }))));
}
function ProfileScreen() {
  const [range, setRange] = React.useState('week');
  const wk = range === 'week';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...pad,
      paddingTop: 56,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      paddingBottom: 120
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 52,
      height: 52,
      borderRadius: 999,
      background: 'var(--bg-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 26,
    color: "var(--ink-secondary)"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      font: 'var(--type-title2-weight) var(--type-title2-size)/1 var(--font-ui)'
    }
  }, "\u0410\u043D\u043D\u0430"), /*#__PURE__*/React.createElement(PlanBadge, {
    plan: "free",
    style: {
      alignSelf: 'flex-start'
    }
  })), /*#__PURE__*/React.createElement(IconButton, {
    icon: "gear-six",
    label: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    variant: "solid"
  })), /*#__PURE__*/React.createElement(SegmentedControl, {
    glass: false,
    options: [{
      value: 'week',
      label: 'Неделя'
    }, {
      value: 'all',
      label: 'Всё время'
    }],
    value: range,
    onChange: setRange,
    style: {
      alignSelf: 'flex-start'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      display: 'flex',
      flexDirection: 'column',
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1px 1fr',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    value: wk ? '12' : '86',
    label: "\u041E\u0431\u0440\u0430\u0437\u043E\u0432 \u0441\u043E\u0431\u0440\u0430\u043D\u043E",
    icon: "sparkle"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      background: 'var(--line)'
    }
  }), /*#__PURE__*/React.createElement(StatTile, {
    tone: "plain",
    value: wk ? '5' : '41',
    label: "\u041D\u0430\u0434\u0435\u0442\u043E",
    icon: "t-shirt"
  })), /*#__PURE__*/React.createElement(TickBars, {
    variant: "lines",
    value: wk ? 31 : 52,
    max: 60,
    count: 60,
    height: 64
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      font: 'var(--type-caption-weight) var(--type-caption-size)/1 var(--font-ui)',
      color: 'var(--ink-secondary)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "target",
    size: 16,
    color: "var(--accent)"
  }), "\u0426\u0435\u043B\u044C \u043D\u0435\u0434\u0435\u043B\u0438: 7 \u043E\u0431\u0440\u0430\u0437\u043E\u0432"), /*#__PURE__*/React.createElement(BigStat, {
    value: wk ? '80' : '74',
    unit: "%",
    trend: "\u043E\u0431\u0440\u0430\u0437\u043E\u0432 \u043F\u043E\u043D\u0440\u0430\u0432\u0438\u043B\u043E\u0441\u044C, \u0431\u043E\u043B\u044C\u0448\u0435 \u0447\u0435\u043C \u043D\u0430 \u043F\u0440\u043E\u0448\u043B\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435",
    trendIcon: "trend-up",
    glow: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(StatTile, {
    value: "5",
    unit: "\u0434\u043D",
    label: "\u0421\u0435\u0440\u0438\u044F",
    icon: "fire",
    tone: "soft"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "18",
    label: "\u0412\u0435\u0449\u0435\u0439 \u0432 \u0448\u043A\u0430\u0444\u0443",
    icon: "coat-hanger"
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "\u0422\u0440\u0435\u043D\u0447",
    size: "sm",
    label: "\u0427\u0430\u0449\u0435 \u0432\u0441\u0435\u0433\u043E \u0432 \u043E\u0431\u0440\u0430\u0437\u0430\u0445",
    icon: "star",
    style: {
      justifyContent: 'flex-end'
    }
  }), /*#__PURE__*/React.createElement(StatTile, {
    value: "4",
    unit: " \u0438\u0437 10",
    label: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435",
    icon: "heart"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      display: 'flex',
      flexDirection: 'column',
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(LimitCounter, {
    size: "large",
    title: "AI-\u043E\u0431\u0440\u0430\u0437\u044B \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u0435",
    remaining: 3,
    total: 5,
    onMore: () => {}
  }), /*#__PURE__*/React.createElement(LimitCounter, {
    size: "large",
    title: "\u0424\u043E\u0442\u043E \u0432\u0435\u0449\u0435\u0439",
    remaining: 12,
    total: 30
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      ...card,
      padding: '8px 20px'
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    label: "\u0423\u0442\u0440\u0435\u043D\u043D\u0435\u0435 \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435",
    description: "\u041A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C \u0432 8:00",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Switch, {
    label: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0432 Telegram"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    fullWidth: true
  }, "\u0423\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u043E\u0439"));
}
Object.assign(window, {
  OutfitScreen,
  ReadyScreen,
  WardrobeScreen,
  ProfileScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/Screens.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.AnswerCard = __ds_scope.AnswerCard;

__ds_ns.BigTextField = __ds_scope.BigTextField;

__ds_ns.Chip = __ds_scope.Chip;

__ds_ns.QuestionProgress = __ds_scope.QuestionProgress;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.TextInput = __ds_scope.TextInput;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.TopBar = __ds_scope.TopBar;

__ds_ns.BottomSheet = __ds_scope.BottomSheet;

__ds_ns.Coachmark = __ds_scope.Coachmark;

__ds_ns.CtaPlate = __ds_scope.CtaPlate;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.BigStat = __ds_scope.BigStat;

__ds_ns.PageDots = __ds_scope.PageDots;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.StatTile = __ds_scope.StatTile;

__ds_ns.TickBars = __ds_scope.TickBars;

__ds_ns.LimitCounter = __ds_scope.LimitCounter;

__ds_ns.PlanBadge = __ds_scope.PlanBadge;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.WeatherPill = __ds_scope.WeatherPill;

__ds_ns.CanvasItem = __ds_scope.CanvasItem;

__ds_ns.ItemTile = __ds_scope.ItemTile;

__ds_ns.OutfitHero = __ds_scope.OutfitHero;

})();
