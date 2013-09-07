# vim:ft=zsh
#
# Sourced from:
# agnoster's Theme - https://gist.github.com/3712874
# A Powerline-inspired theme for ZSH
#
# # README
#
# In order for this theme to render correctly, you will need a
# [Powerline-patched font](https://gist.github.com/1595572).
#
# In addition, I recommend the
# [Solarized theme](https://github.com/altercation/solarized/) and, if you're
# using it on Mac OS X, [iTerm 2](http://www.iterm2.com/) over Terminal.app -
# it has significantly better color fidelity.
#
# # Goals
#
# The aim of this theme is to only show you *relevant* information. Like most
# prompts, it will only show git information when in a git working directory.
# However, it goes a step further: everything from the current user and
# hostname to whether the last call exited with an error to whether background
# jobs are running in this shell will all be displayed automatically when
# appropriate.

CURRENT_BG='NONE'
SEGMENT_SEPARATOR=''
R_SEGMENT_SEPARATOR=''

### Git Options
POWERLINE_GIT_SUFFIX=""
POWERLINE_GIT_SUFFIX_BG_COLOR="black"
POWERLINE_GIT_SUFFIX_TEXT_COLOR="yellow"
# # Repo Clean bg/text color
POWERLINE_GIT_STATUS_CLEAN_BG_COLOR="black"
POWERLINE_GIT_STATUS_CLEAN_TEXT_COLOR="yellow"
# # Repo Dirty bg/text color
POWERLINE_GIT_STATUS_DIRTY_BG_COLOR="white"
POWERLINE_GIT_STATUS_DIRTY_TEXT_COLOR="blue"
# # symbols
POWERLINE_GIT_STATUS_CLEAN="%F{green}✔%F{black}"
POWERLINE_GIT_STATUS_DIRTY="%F{red}✘%F{black}"
POWERLINE_GIT_STATUS_ADDED="%F{green}✚%F{black}"
POWERLINE_GIT_STATUS_MODIFIED="%F{blue}✹%F{black}"
POWERLINE_GIT_STATUS_DELETED="%F{red}✖%F{black}"
POWERLINE_GIT_STATUS_UNTRACKED="%F{yellow}✭%F{black}"
POWERLINE_GIT_STATUS_RENAMED="%F{blue}➜%F{black}"
POWERLINE_GIT_STATUS_STASHED="%F{yellow}☑%F{black}"
POWERLINE_GIT_STATUS_UNMERGED="%F{yellow}═%F{black}"
POWERLINE_GIT_STATUS_AHEAD="⬆"
POWERLINE_GIT_STATUS_BEHIND="⬇"
POWERLINE_GIT_STATUS_DIVERGED="⬍"

# Begin a segment
# Takes two arguments, background and foreground. Both can be omitted,
# rendering default background/foreground.
prompt_segment() {
    local bg fg
    [[ -n $1 ]] && bg="%K{$1}" || bg="%k"
    [[ -n $2 ]] && fg="%F{$2}" || fg="%f"
    if [[ $CURRENT_BG != 'NONE' && $1 != $CURRENT_BG ]]; then
        echo -n " %{$bg%F{$CURRENT_BG}%}$SEGMENT_SEPARATOR%{$fg%} "
    else
        echo -n "%{$bg%}%{$fg%} "
    fi
    CURRENT_BG=$1
    [[ -n $3 ]] && echo -n $3
}

# End the prompt, closing any open segments
prompt_end() {
    if [[ -n $CURRENT_BG ]]; then
        echo -n " %{%k%F{$CURRENT_BG}%}$SEGMENT_SEPARATOR"
    else
        echo -n "%{%k%}"
    fi
    echo -n "%{%f%}"
    CURRENT_BG=''
}

### Prompt components
# Each component will draw itself, and hide itself if no information needs to be shown

# Context: user@hostname (who am I and where am I)
prompt_context() {
    local user=`whoami`

    if [[ "$user" != "$DEFAULT_USER" || -n "$SSH_CLIENT" ]]; then
        prompt_segment black default "%(!.%{%F{yellow}%}.)$user@%m"
    fi
}

# Dir: current working directory
prompt_dir() {
    prompt_segment blue black '%~'
}

# Status:
# - was there an error
# - am I root
# - are there background jobs?
prompt_status() {
    local symbols
        symbols=()
        [[ $RETVAL -ne 0 ]] && symbols+="%{%F{red}%}✘"
        [[ $UID -eq 0 ]] && symbols+="%{%F{yellow}%}⚡"
        [[ $(jobs -l | wc -l) -gt 0 ]] && symbols+="%{%F{cyan}%}⚙"

        [[ -n "$symbols" ]] && prompt_segment black default "$symbols"
}

# Git repo support
build_git_info() {
# If there is no repo don't bother
    if ! $(git rev-parse --is-inside-work-tree >/dev/null 2>&1); then
        return;
    fi

    INDEX=$(command git status --porcelain -b 2> /dev/null)
    SYMBOLS=""
    DIRTY=false

    if $(echo "$INDEX" | grep "^[\? ]\{2\}" &> /dev/null); then
        SYMBOLS=" $POWERLINE_GIT_STATUS_UNTRACKED$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep "^[A ]\{2\}" &> /dev/null); then
        SYMBOLS=" $POWERLINE_GIT_STATUS_ADDED$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep "^[M ]\{2\}" &> /dev/null); then
        SYMBOLS=" $POWERLINE_GIT_STATUS_MODIFIED$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep "^[R ]\{2\}" &> /dev/null); then
        SYMBOLS="$POWERLINE_GIT_STATUS_RENAMED$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep "^[D ]\{2\}" &> /dev/null); then
        SYMBOLS="$POWERLINE_GIT_STATUS_DELETED$SYMBOLS"
        DIRTY=true
    fi

    if $(command git rev-parse --verify refs/stash >/dev/null 2>&1); then
        SYMBOLS="$POWERLINE_GIT_STATUS_STASHED$SYMBOLS"
    fi

    if $(echo "$INDEX" | grep '^[U ]\{2\}' &> /dev/null); then
        SYMBOLS="$POWERLINE_GIT_STATUS_UNMERGED$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep '^## .*ahead' &> /dev/null); then
        SYMBOLS="$POWERLINE_GIT_STATUS_AHEAD$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep '^## .*behind' &> /dev/null); then
        SYMBOLS="$POWERLINE_GIT_STATUS_BEHIND$SYMBOLS"
        DIRTY=true
    fi

    if $(echo "$INDEX" | grep '^## .*diverged' &> /dev/null); then
        SYMBOLS="$POWERLINE_GIT_STATUS_DIVERGED$SYMBOLS"
        DIRTY=true
    fi

    if $DIRTY; then
        BG_COLOR=${POWERLINE_GIT_STATUS_DIRTY_BG_COLOR}
        TEXT_COLOR=${POWERLINE_GIT_STATUS_DIRTY_TEXT_COLOR}
    else
        BG_COLOR=${POWERLINE_GIT_STATUS_CLEAN_BG_COLOR}
        TEXT_COLOR=${POWERLINE_GIT_STATUS_CLEAN_TEXT_COLOR}
    fi

    # Get branch name
    REF=$(command git symbolic-ref HEAD 2> /dev/null)
    REF=${REF} || ref=$(command git rev-parse --short HEAD 2> /dev/null)
    REF=${REF#refs/heads/}

    # Construct line
    GIT_LINE="%F{${BG_COLOR}}${R_SEGMENT_SEPARATOR}"
    GIT_LINE="${GIT_LINE}%F{${TEXT_COLOR}}%K{${BG_COLOR}} ${SYMBOLS} ${REF} "
    # Style git symbol seperately
    GIT_LINE="${GIT_LINE}%F{${POWERLINE_GIT_SUFFIX_BG_COLOR}}${R_SEGMENT_SEPARATOR}"
    GIT_LINE="${GIT_LINE}%F{${POWERLINE_GIT_SUFFIX_TEXT_COLOR}}%K{${POWERLINE_GIT_SUFFIX_BG_COLOR}}"
    GIT_LINE="${GIT_LINE} ${POWERLINE_GIT_SUFFIX} "

    # Echo it out
    echo -n "${GIT_LINE}"
}

## Main prompt
build_prompt() {
    RETVAL=$?
    prompt_status
    prompt_context
    prompt_dir
    prompt_end
}
PROMPT='%{%f%b%k%}$(build_prompt) '

## Right prompt
RPROMPT='$(build_git_info)'
