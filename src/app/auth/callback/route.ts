import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  console.log('Auth callback hit, code:', code ? 'present' : 'missing')

  if (!code) {
    console.log('No code, redirecting to auth')
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    console.log('Session exchange error:', sessionError)

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User:', user?.id, 'Error:', userError)

    if (!user) {
      console.log('No user found, redirecting to auth')
      return NextResponse.redirect(new URL('/auth', request.url))
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, onboarding_complete')
      .eq('id', user.id)
      .single()

    console.log('Profile:', profile, 'Error:', profileError)

    if (!profile) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({ 
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || ''
        })
      console.log('Insert error:', insertError)
      return NextResponse.redirect(new URL('/onboarding/start', request.url))
    }

    if (profile.onboarding_complete) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return NextResponse.redirect(new URL('/onboarding/start', request.url))

  } catch (err) {
    console.error('Callback error:', err)
    return NextResponse.redirect(new URL('/auth', request.url))
  }
}
